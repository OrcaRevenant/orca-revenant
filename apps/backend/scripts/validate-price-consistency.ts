#!/usr/bin/env ts-node

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface PriceRecord {
  asset: string;
  price: number;
  time: Date;
}

interface InconsistencyReport {
  recordIndex: number;
  expectedTime: Date;
  actualTime: Date;
  timeDifference: number; // in minutes (absolute value)
  timeDiffMs: number; // in milliseconds (signed, positive = late, negative = early)
  asset: string;
}

class PriceConsistencyValidator {
  private pool: Pool;
  private backfillStep: number; // in minutes

  constructor(databaseUrl: string, backfillStep: number = 3) {
    this.pool = new Pool({
      connectionString: databaseUrl,
    });
    this.backfillStep = backfillStep;
  }

  async connect(): Promise<void> {
    try {
      await this.pool.connect();
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    console.log('🔌 Database connection closed');
  }

  async getAllAssets(): Promise<string[]> {
    const query = `
      SELECT DISTINCT asset 
      FROM price 
      ORDER BY asset ASC
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows.map(row => row.asset);
    } catch (error) {
      console.error('❌ Error fetching asset list:', error);
      throw error;
    }
  }

  async validateAssetPriceConsistency(assetName: string): Promise<InconsistencyReport[]> {
    console.log(`🔍 Validating price consistency for asset: ${assetName}`);
    console.log(`📅 Expected interval: ${this.backfillStep} minutes`);

    const query = `
      SELECT asset, price, time
      FROM price 
      WHERE asset = $1 
      ORDER BY time ASC
    `;

    try {
      const result = await this.pool.query(query, [assetName.toLowerCase()]);
      const records: PriceRecord[] = result.rows.map(row => ({
        asset: row.asset,
        price: parseFloat(row.price),
        time: new Date(row.time)
      }));

      if (records.length === 0) {
        console.log(`⚠️  No price records found for asset: ${assetName}`);
        return [];
      }

      console.log(`📊 Found ${records.length} price records for ${assetName}`);
      console.log(`⏰ Time range: ${records[0].time.toISOString()} to ${records[records.length - 1].time.toISOString()}`);
      
      const validationEndTime = records.length > 2 ? records[records.length - 2].time : records[records.length - 1].time;
      console.log(`🔍 Validation range: ${records[0].time.toISOString()} to ${validationEndTime.toISOString()}`);
      console.log(`   (Most recent record ${records.length > 2 ? 'excluded' : 'included'}: ${records[records.length - 1].time.toISOString()})`);

      return this.checkTimeConsistency(records);

    } catch (error) {
      console.error('❌ Error querying price data:', error);
      throw error;
    }
  }

  private checkTimeConsistency(records: PriceRecord[]): InconsistencyReport[] {
    const inconsistencies: InconsistencyReport[] = [];
    const intervalMs = this.backfillStep * 60 * 1000; // Convert minutes to milliseconds

    console.log('\n🔍 Checking time consistency...');

    if (records.length < 2) {
      console.log('   ℹ️  Not enough records to validate consistency (need at least 2)');
      return inconsistencies;
    }

    // Validate all consecutive pairs except skip the last record if there are 3+ records
    // This avoids checking if there should be a record after the most recent one
    const recordsToCheck = records.length > 2 ? records.length - 1 : records.length;
    const totalComparisons = recordsToCheck - 1;
    
    console.log(`   📊 Checking ${totalComparisons} record pairs for consistency...`);
    
    for (let i = 1; i < recordsToCheck; i++) {
      const currentRecord = records[i];
      const previousRecord = records[i - 1];
      
      const expectedTime = new Date(previousRecord.time.getTime() + intervalMs);
      const actualTime = currentRecord.time;
      const timeDiff = actualTime.getTime() - expectedTime.getTime(); // Don't use Math.abs to preserve direction
      const timeDiffMinutes = Math.abs(timeDiff) / (60 * 1000);

      // Allow for small timing variations (±30 seconds)
      const toleranceMs = 30 * 1000;

      if (Math.abs(timeDiff) > toleranceMs) {
        const status = timeDiff > 0 ? 'GAP (Missing data)' : 'EARLY (Premature data)';
        
        // Log the issue immediately when found
        console.log(`   ❌ ISSUE FOUND at Record Index ${i}:`);
        console.log(`      Previous: ${previousRecord.time.toISOString()} (${previousRecord.asset})`);
        console.log(`      Expected: ${expectedTime.toISOString()}`);
        console.log(`      Actual:   ${actualTime.toISOString()}`);
        console.log(`      Gap:      ${timeDiffMinutes.toFixed(2)} minutes`);
        console.log(`      Status:   ${status}`);
        console.log(`      Location: Between record ${i-1} and ${i}`);
        console.log('');

        inconsistencies.push({
          recordIndex: i,
          expectedTime: expectedTime,
          actualTime: actualTime,
          timeDifference: timeDiffMinutes,
          timeDiffMs: timeDiff,
          asset: currentRecord.asset
        });
      }
    }

    if (records.length > 2) {
      console.log(`   ℹ️  Excluded validation of most recent record (${records[records.length - 1].time.toISOString()})`);
    }
    
    console.log(`   ✅ Validation complete: Found ${inconsistencies.length} inconsistencies out of ${totalComparisons} checked pairs`);

    return inconsistencies;
  }

  async generateSingleAssetReport(assetName: string): Promise<{ asset: string, inconsistencies: InconsistencyReport[] }> {
    const inconsistencies = await this.validateAssetPriceConsistency(assetName);
    return { asset: assetName, inconsistencies };
  }

  async generateAllAssetsReport(): Promise<{ asset: string, inconsistencies: InconsistencyReport[] }[]> {
    console.log('🔍 Fetching all assets from database...');
    const assets = await this.getAllAssets();
    
    if (assets.length === 0) {
      console.log('⚠️  No assets found in the price table');
      return [];
    }

    console.log(`📊 Found ${assets.length} unique assets: ${assets.join(', ')}`);
    console.log('\n' + '='.repeat(80));
    
    const results: { asset: string, inconsistencies: InconsistencyReport[] }[] = [];
    
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      console.log(`\n[${i + 1}/${assets.length}] Processing ${asset.toUpperCase()}...`);
      console.log('-'.repeat(50));
      
      try {
        const result = await this.generateSingleAssetReport(asset);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to process ${asset}:`, error);
        results.push({ asset, inconsistencies: [] });
      }
    }
    
    return results;
  }

  private displayAssetReport(asset: string, inconsistencies: InconsistencyReport[], showDetails: boolean = true): void {
    if (inconsistencies.length === 0) {
      console.log(`✅ ${asset.toUpperCase()}: All price records are consistent!`);
      console.log(`   All records follow the expected ${this.backfillStep}-minute interval.`);
    } else {
      console.log(`❌ ${asset.toUpperCase()}: Found ${inconsistencies.length} inconsistencies`);
      
      if (showDetails) {
        console.log('\n📍 Inconsistency Details:');
        console.log('-'.repeat(40));
        
        inconsistencies.forEach((inc, index) => {
          const status = inc.timeDiffMs > 0 ? 'GAP (Missing data)' : 'EARLY (Premature data)';
          console.log(`\n${index + 1}. 🎯 EXACT ISSUE LOCATION:`);
          console.log(`   Asset: ${inc.asset.toUpperCase()}`);
          console.log(`   Record Index: ${inc.recordIndex} (between records ${inc.recordIndex - 1} and ${inc.recordIndex})`);
          console.log(`   Expected Time: ${inc.expectedTime.toISOString()}`);
          console.log(`   Actual Time:   ${inc.actualTime.toISOString()}`);
          console.log(`   Time Gap:      ${inc.timeDifference.toFixed(2)} minutes`);
          console.log(`   Issue Type:    ${status}`);
          console.log(`   Exact Problem: ${status === 'GAP (Missing data)' ? 
            `Missing price record at ${inc.expectedTime.toISOString()}` : 
            `Record arrived ${inc.timeDifference.toFixed(2)} minutes early`}`);
        });
      }

      console.log('\n📊 Summary:');
      console.log('-'.repeat(20));
      const gaps = inconsistencies.filter(inc => inc.timeDiffMs > 0);
      const early = inconsistencies.filter(inc => inc.timeDiffMs < 0);
      console.log(`   Data Gaps: ${gaps.length}`);
      console.log(`   Early Records: ${early.length}`);
      console.log(`   Total Issues: ${inconsistencies.length}`);
    }
  }

  async generateReport(assetName?: string): Promise<void> {
    try {
      await this.connect();
      
      console.log('\n' + '='.repeat(60));
      console.log('📋 PRICE CONSISTENCY VALIDATION REPORT');
      console.log('='.repeat(60));
      
      if (assetName) {
        // Single asset validation
        const result = await this.generateSingleAssetReport(assetName);
        this.displayAssetReport(result.asset, result.inconsistencies, true);
      } else {
        // All assets validation
        const results = await this.generateAllAssetsReport();
        
        if (results.length === 0) {
          console.log('⚠️  No assets to validate');
          return;
        }

        // Display individual asset results (summary only for multiple assets)
        results.forEach((result, index) => {
          if (index > 0) console.log('\n' + '-'.repeat(50));
          this.displayAssetReport(result.asset, result.inconsistencies, false);
        });

        // Overall summary
        console.log('\n' + '='.repeat(60));
        console.log('🎯 OVERALL SUMMARY');
        console.log('='.repeat(60));
        
        const totalAssets = results.length;
        const consistentAssets = results.filter(r => r.inconsistencies.length === 0).length;
        const inconsistentAssets = totalAssets - consistentAssets;
        const totalIssues = results.reduce((sum, r) => sum + r.inconsistencies.length, 0);
        
        console.log(`📊 Assets Processed: ${totalAssets}`);
        console.log(`✅ Consistent Assets: ${consistentAssets}`);
        console.log(`❌ Inconsistent Assets: ${inconsistentAssets}`);
        console.log(`🔍 Total Issues Found: ${totalIssues}`);
        
        if (inconsistentAssets > 0) {
          console.log('\n📋 Assets with Issues:');
          results
            .filter(r => r.inconsistencies.length > 0)
            .forEach(r => {
              const gaps = r.inconsistencies.filter(inc => inc.timeDiffMs > 0).length;
              const early = r.inconsistencies.filter(inc => inc.timeDiffMs < 0).length;
              console.log(`   • ${r.asset.toUpperCase()}: ${r.inconsistencies.length} issues (${gaps} gaps, ${early} early)`);
            });
        }
      }

      console.log('\n' + '='.repeat(60));
      
    } catch (error) {
      console.error('💥 Validation failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  // Show help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: ts-node validate-price-consistency.ts [asset-name|interval] [backfill-step-minutes]');
    console.log('');
    console.log('Options:');
    console.log('  asset-name              Specific asset to validate (optional)');
    console.log('  interval                If first argument is a number, validates all assets with that interval');
    console.log('  backfill-step-minutes   Expected interval in minutes (default: 3)');
    console.log('');
    console.log('Examples:');
    console.log('  ts-node validate-price-consistency.ts                    # Validate all assets (3-min interval)');
    console.log('  ts-node validate-price-consistency.ts 5                  # Validate all assets (5-min interval)');
    console.log('  ts-node validate-price-consistency.ts bitcoin            # Validate Bitcoin (3-min interval)');
    console.log('  ts-node validate-price-consistency.ts bitcoin 5          # Validate Bitcoin (5-min interval)');
    process.exit(0);
  }

  // Smart parsing: if first argument is a number, treat it as interval for all assets
  let assetName: string | null = null;
  let backfillStep: number = 3;

  if (args.length > 0) {
    const firstArg = args[0];
    const firstArgAsNumber = parseInt(firstArg);
    
    if (!isNaN(firstArgAsNumber) && firstArgAsNumber > 0 && firstArg === firstArgAsNumber.toString()) {
      // First argument is a positive integer, treat as interval for all assets
      assetName = null;
      backfillStep = firstArgAsNumber;
    } else {
      // First argument is asset name
      assetName = firstArg;
      backfillStep = args[1] ? parseInt(args[1]) : 3;
    }
  }
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  if (isNaN(backfillStep) || backfillStep <= 0) {
    console.error('❌ Invalid backfill step. Must be a positive number.');
    process.exit(1);
  }

  console.log('🚀 Starting Price Consistency Validation');
  console.log('=' + '='.repeat(50));
  
  if (assetName) {
    console.log(`📈 Asset: ${assetName}`);
  } else {
    console.log('📈 Assets: All assets in database');
  }
  
  console.log(`⏱️  Backfill Step: ${backfillStep} minutes`);
  console.log(`🗄️  Database: ${databaseUrl.split('@')[1] || 'Connected'}`);

  const validator = new PriceConsistencyValidator(databaseUrl, backfillStep);
  
  try {
    await validator.generateReport(assetName);
  } catch (error) {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received interrupt signal. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received terminate signal. Shutting down gracefully...');
  process.exit(0);
});

if (require.main === module) {
  main();
} 
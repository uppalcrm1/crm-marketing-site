#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config();

// Staging database configuration
const stagingDbConfig = process.env.STAGING_DATABASE_URL ? {
  connectionString: process.env.STAGING_DATABASE_URL,
  ssl: process.env.STAGING_DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
} : {
  host: process.env.STAGING_DB_HOST || 'localhost',
  port: process.env.STAGING_DB_PORT || 5432,
  database: process.env.STAGING_DB_NAME,
  user: process.env.STAGING_DB_USER,
  password: process.env.STAGING_DB_PASSWORD,
  ssl: false
};

const pool = new Pool(stagingDbConfig);

async function deploySubscriptionSchema() {
  try {
    console.log('🚀 Deploying subscription management system to STAGING...');
    console.log('Database:', process.env.STAGING_DATABASE_URL?.split('@')[1]?.split('/')[0] || 'staging');

    // 1. Create subscription tables
    console.log('\n📋 Creating subscription tables...');
    const createTablesScript = require('../scripts/create-subscription-tables');
    // Temporarily override query function to use staging pool
    const originalQuery = require('../database/connection').query;
    require('../database/connection').query = (text, params) => pool.query(text, params);

    try {
      await createTablesScript();
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('⚠️  Some tables already exist, continuing...');
    }

    // 2. Create subscription functions
    console.log('\n⚙️  Creating subscription functions...');
    const createFunctionsScript = require('../scripts/create-subscription-functions');

    try {
      await createFunctionsScript();
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('⚠️  Some functions already exist, continuing...');
    }

    // 3. Seed subscription data
    console.log('\n🌱 Seeding subscription data...');
    const seedDataScript = require('../scripts/seed-subscription-data');

    try {
      await seedDataScript();
    } catch (error) {
      if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
        throw error;
      }
      console.log('⚠️  Some seed data already exists, continuing...');
    }

    // Restore original query function
    require('../database/connection').query = originalQuery;

    // 4. Verify deployment
    console.log('\n🔍 Verifying subscription system deployment...');

    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'subscription_plans', 'organization_subscriptions', 'subscription_usage',
        'subscription_invoices', 'subscription_events', 'plan_features', 'plan_feature_mappings'
      )
      ORDER BY table_name;
    `);

    const functionsResult = await pool.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN (
        'get_current_usage', 'check_usage_limits', 'has_feature_access',
        'generate_invoice_number', 'update_updated_at_column'
      )
      ORDER BY routine_name;
    `);

    const plansResult = await pool.query(`
      SELECT name, display_name FROM subscription_plans WHERE is_active = true ORDER BY sort_order;
    `);

    console.log('\n📊 Deployment Summary:');
    console.log(`✅ Subscription tables: ${tablesResult.rows.length}/7`);
    console.log('   -', tablesResult.rows.map(r => r.table_name).join(', '));
    console.log(`✅ Subscription functions: ${functionsResult.rows.length}/5`);
    console.log('   -', functionsResult.rows.map(r => r.routine_name).join(', '));
    console.log(`✅ Subscription plans: ${plansResult.rows.length}/4`);
    console.log('   -', plansResult.rows.map(r => r.display_name).join(', '));

    console.log('\n🎉 Subscription management system deployed successfully to STAGING!');
    console.log('\n📋 Next Steps:');
    console.log('1. 🌐 Test at: https://uppalcrm-frontend-staging.onrender.com/subscription');
    console.log('2. 🔑 Login with your staging credentials');
    console.log('3. 🧪 Test subscription management features');
    console.log('4. 📧 Verify trial expiration notifications work');
    console.log('5. 🤖 Check that billing automation jobs are running');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Only run if called directly
if (require.main === module) {
  deploySubscriptionSchema();
}

module.exports = deploySubscriptionSchema;
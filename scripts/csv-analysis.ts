import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

interface CSVRow {
  supplier: string;
  product_name: string;
  price: string;
  price_raw: string;
  vehicle_make: string;
  vehicle_model: string;
  year_range: string;
  main_category: string;
  subcategory: string;
  brand: string;
  engine_size: string;
  oem_part_number: string;
  category: string;
  description: string;
  product_url: string;
  image_urls: string;
  scrape_date: string;
}

interface ColumnMapping {
  csvColumn: string;
  safeName: string;
  sqlType: string;
  sampleValue: string;
  reasoning: string;
}

async function analyzeCSV() {
  console.log('📊 CSV Analysis Report');
  console.log('=' .repeat(80));
  
  const csvPath = path.join(process.cwd(), 'attached_assets', 'combined_master_1762595051951.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records: CSVRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  console.log(`\n✅ CSV file loaded successfully`);
  console.log(`📝 Total rows: ${records.length}`);
  console.log(`📋 Columns: ${Object.keys(records[0] || {}).length}\n`);
  
  // Column mapping analysis
  const mappings: ColumnMapping[] = [
    {
      csvColumn: 'supplier',
      safeName: 'supplier',
      sqlType: 'text',
      sampleValue: records[0]?.supplier || '',
      reasoning: 'Supplier name - will be normalized to suppliers table'
    },
    {
      csvColumn: 'product_name',
      safeName: 'product_name',
      sqlType: 'text',
      sampleValue: records[0]?.product_name || '',
      reasoning: 'Product name - primary display field'
    },
    {
      csvColumn: 'price',
      safeName: 'price',
      sqlType: 'numeric(12,2)',
      sampleValue: records[0]?.price || '0',
      reasoning: 'Numeric price - currently 0, stored as decimal for precision'
    },
    {
      csvColumn: 'price_raw',
      safeName: 'price_raw',
      sqlType: 'text',
      sampleValue: records[0]?.price_raw || '',
      reasoning: 'Original price string (KSh format) - kept for reference'
    },
    {
      csvColumn: 'vehicle_make',
      safeName: 'vehicle_make',
      sqlType: 'text',
      sampleValue: records[0]?.vehicle_make || '',
      reasoning: 'Vehicle manufacturer - used for compatibility filtering'
    },
    {
      csvColumn: 'vehicle_model',
      safeName: 'vehicle_model',
      sqlType: 'text',
      sampleValue: records[0]?.vehicle_model || '',
      reasoning: 'Vehicle model - used for compatibility filtering'
    },
    {
      csvColumn: 'year_range',
      safeName: 'year_range',
      sqlType: 'text',
      sampleValue: records[0]?.year_range || '',
      reasoning: 'Year compatibility - stored as text due to variable formats (single year, range)'
    },
    {
      csvColumn: 'main_category',
      safeName: 'main_category',
      sqlType: 'text',
      sampleValue: records[0]?.main_category || '',
      reasoning: 'Primary category - will be normalized to categories table'
    },
    {
      csvColumn: 'subcategory',
      safeName: 'subcategory',
      sqlType: 'text',
      sampleValue: records[0]?.subcategory || '',
      reasoning: 'Secondary category - hierarchical relationship to main_category'
    },
    {
      csvColumn: 'brand',
      safeName: 'brand',
      sqlType: 'text',
      sampleValue: records[0]?.brand || '',
      reasoning: 'Brand name - will be normalized to brands table'
    },
    {
      csvColumn: 'engine_size',
      safeName: 'engine_size',
      sqlType: 'text',
      sampleValue: records[0]?.engine_size || '',
      reasoning: 'Engine size specification - stored as text due to variable formats'
    },
    {
      csvColumn: 'oem_part_number',
      safeName: 'oem_part_number',
      sqlType: 'text',
      sampleValue: records[0]?.oem_part_number || '',
      reasoning: 'OEM part number - critical for part identification and cross-reference'
    },
    {
      csvColumn: 'category',
      safeName: 'category_extra',
      sqlType: 'text',
      sampleValue: records[0]?.category || '',
      reasoning: 'Additional category info - stored in extra_attributes JSONB'
    },
    {
      csvColumn: 'description',
      safeName: 'description',
      sqlType: 'text',
      sampleValue: (records[0]?.description || '').substring(0, 100) + '...',
      reasoning: 'Product description - full text for search and display'
    },
    {
      csvColumn: 'product_url',
      safeName: 'product_url',
      sqlType: 'text',
      sampleValue: records[0]?.product_url || '',
      reasoning: 'Source product URL - kept for reference and potential scraping updates'
    },
    {
      csvColumn: 'image_urls',
      safeName: 'image_urls',
      sqlType: 'text[]',
      sampleValue: records[0]?.image_urls || '',
      reasoning: 'Product images - stored as text array, single char means no image'
    },
    {
      csvColumn: 'scrape_date',
      safeName: 'scrape_date',
      sqlType: 'text',
      sampleValue: records[0]?.scrape_date || '',
      reasoning: 'Data collection timestamp - stored as text, can be parsed later'
    }
  ];
  
  console.log('📋 Column Mapping Table:\n');
  console.log('| CSV Column         | Safe Name          | SQL Type         | Sample Value                    |');
  console.log('|--------------------|--------------------|-----------------|---------------------------------|');
  mappings.forEach(m => {
    const sample = m.sampleValue.substring(0, 30).replace(/\n/g, ' ');
    console.log(`| ${m.csvColumn.padEnd(18)} | ${m.safeName.padEnd(18)} | ${m.sqlType.padEnd(15)} | ${sample.padEnd(31)} |`);
  });
  
  console.log('\n📊 Data Quality Analysis:\n');
  
  // Analyze data completeness
  const stats = {
    totalRows: records.length,
    withSupplier: records.filter(r => r.supplier?.trim()).length,
    withBrand: records.filter(r => r.brand?.trim() && r.brand !== 'Unknown').length,
    withVehicleMake: records.filter(r => r.vehicle_make?.trim()).length,
    withOEM: records.filter(r => r.oem_part_number?.trim()).length,
    withImages: records.filter(r => r.image_urls?.trim() && r.image_urls.length > 5).length,
    withMainCategory: records.filter(r => r.main_category?.trim() && r.main_category !== 'Uncategorized').length,
    withSubcategory: records.filter(r => r.subcategory?.trim()).length,
  };
  
  console.log(`Total rows: ${stats.totalRows}`);
  console.log(`With supplier: ${stats.withSupplier} (${(stats.withSupplier/stats.totalRows*100).toFixed(1)}%)`);
  console.log(`With brand: ${stats.withBrand} (${(stats.withBrand/stats.totalRows*100).toFixed(1)}%)`);
  console.log(`With vehicle make: ${stats.withVehicleMake} (${(stats.withVehicleMake/stats.totalRows*100).toFixed(1)}%)`);
  console.log(`With OEM number: ${stats.withOEM} (${(stats.withOEM/stats.totalRows*100).toFixed(1)}%)`);
  console.log(`With images: ${stats.withImages} (${(stats.withImages/stats.totalRows*100).toFixed(1)}%)`);
  console.log(`With main category: ${stats.withMainCategory} (${(stats.withMainCategory/stats.totalRows*100).toFixed(1)}%)`);
  console.log(`With subcategory: ${stats.withSubcategory} (${(stats.withSubcategory/stats.totalRows*100).toFixed(1)}%)`);
  
  // Unique values analysis
  console.log('\n🔍 Unique Values:\n');
  const uniqueSuppliers = new Set(records.map(r => r.supplier).filter(Boolean));
  const uniqueBrands = new Set(records.map(r => r.brand).filter(Boolean));
  const uniqueCategories = new Set(records.map(r => r.main_category).filter(Boolean));
  const uniqueSubcategories = new Set(records.map(r => r.subcategory).filter(Boolean));
  
  console.log(`Suppliers: ${uniqueSuppliers.size}`);
  console.log(`  → ${Array.from(uniqueSuppliers).join(', ')}`);
  console.log(`\nBrands: ${uniqueBrands.size}`);
  console.log(`  → ${Array.from(uniqueBrands).slice(0, 15).join(', ')}${uniqueBrands.size > 15 ? '...' : ''}`);
  console.log(`\nMain Categories: ${uniqueCategories.size}`);
  console.log(`  → ${Array.from(uniqueCategories).join(', ')}`);
  console.log(`\nSubcategories: ${uniqueSubcategories.size}`);
  console.log(`  → ${Array.from(uniqueSubcategories).slice(0, 10).join(', ')}${uniqueSubcategories.size > 10 ? '...' : ''}`);
  
  // Save mapping as JSON
  const outputPath = path.join(process.cwd(), 'scripts', 'csv-column-mapping.json');
  fs.writeFileSync(outputPath, JSON.stringify({ mappings, stats }, null, 2));
  console.log(`\n✅ Mapping saved to: ${outputPath}`);
  
  console.log('\n' + '='.repeat(80));
}

analyzeCSV().catch(console.error);

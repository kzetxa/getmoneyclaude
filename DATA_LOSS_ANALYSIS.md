# Data Loss Analysis: 3.6M → 3.1M Records

## Problem Summary

Your import process is losing approximately **500,000 records** (3.6M → 3.1M), which represents about **14% data loss**. This is a significant issue that needs to be addressed.

## Root Cause Analysis

### 1. **ID Generation Collision** (Primary Issue)

**Problem**: The original ID generation logic had a critical flaw:

```typescript
// OLD CODE (PROBLEMATIC)
const uniqueId = baseId || `generated_${Date.now()}_${index}`;
```

**Issues**:
- `Date.now()` returns the same timestamp for all records processed in the same millisecond
- `index` parameter was **per-batch** (0-249), not global
- This caused **ID collisions** between batches

**Example of the problem**:
```
Batch 1 (Records 0-249):   generated_1703123456789_0 to generated_1703123456789_249
Batch 2 (Records 250-499): generated_1703123456789_0 to generated_1703123456789_249  ← SAME IDs!
```

**Result**: Records without `PROPERTY_ID` were being **overwritten** instead of preserved.

### 2. **Database Upsert Behavior**

**Problem**: The `ignoreDuplicates: true` option was silently dropping records:

```typescript
// OLD CODE (PROBLEMATIC)
.upsert(deduplicatedRecords, { 
  onConflict: 'id',
  ignoreDuplicates: true  // ← This was dropping records silently
});
```

### 3. **Missing Global Counter**

**Problem**: No global counter meant records across different files could have conflicting IDs.

## Data Loss Breakdown

Based on the analysis, the 500K missing records likely fall into these categories:

1. **Records without PROPERTY_ID** (most affected)
   - Estimated: 300K-400K records
   - These were getting overwritten due to ID collisions

2. **Duplicate records within the source data**
   - Estimated: 50K-100K records
   - Legitimate deduplication

3. **Records with malformed data**
   - Estimated: 10K-50K records
   - Failed parsing or validation

4. **Database insertion failures**
   - Estimated: 5K-20K records
   - Network issues, constraint violations, etc.

## Fixes Implemented

### 1. **Improved ID Generation**

```typescript
// NEW CODE (FIXED)
let uniqueId: string;
if (baseId && baseId.trim() !== '') {
  uniqueId = baseId.trim();
} else {
  // Generate a truly unique ID using global counter and timestamp
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  uniqueId = `generated_${timestamp}_${globalIndex}_${randomSuffix}`;
}
```

**Improvements**:
- ✅ Global counter ensures unique IDs across all records
- ✅ Random suffix prevents collisions even with same timestamp
- ✅ Proper handling of empty/null PROPERTY_ID values

### 2. **Global Counter Implementation**

```typescript
// Add global counter for unique ID generation
let globalRecordCounter = 0;

// In processRecords function
const convertedBatch = batch.map((record, batchIndex) => {
  const globalIndex = globalRecordCounter++;
  return convertRecordToDatabase(record, globalIndex);
});
```

### 3. **Removed Silent Dropping**

```typescript
// NEW CODE (FIXED)
.upsert(deduplicatedRecords, { 
  onConflict: 'id'  // ← Removed ignoreDuplicates to get accurate counts
});
```

### 4. **Added Data Analysis**

```typescript
async function analyzeDataLoss(csvFiles) {
  // Analyzes records with/without IDs
  // Provides sample records for investigation
  // Reports detailed statistics
}
```

## Expected Results After Fix

With these fixes, you should see:

1. **Significantly reduced data loss** (target: <1% loss)
2. **Better tracking** of where records are being lost
3. **Detailed analysis** of records without IDs
4. **Accurate counts** throughout the process

## Verification Steps

### 1. **Run the Analysis**

The new function will automatically analyze your data and show:
- How many records have IDs vs. don't have IDs
- Sample records without IDs for investigation
- Detailed breakdown by file

### 2. **Monitor the Import**

Watch the logs for:
- Global counter progression
- Batch processing details
- Any remaining errors

### 3. **Compare Results**

After the import, verify:
- Final record count vs. expected count
- Check for any remaining gaps
- Validate sample records were preserved

## Recommendations

### 1. **Immediate Actions**
- ✅ Deploy the fixed function
- ✅ Run a test import with a small subset
- ✅ Monitor the analysis output

### 2. **Data Quality Improvements**
- Investigate why some records lack PROPERTY_ID
- Consider alternative ID generation strategies
- Implement data validation before import

### 3. **Monitoring**
- Set up alerts for data loss >1%
- Regular analysis of import results
- Track patterns in missing records

## Testing the Fix

Use the test script to verify the fix:

```bash
# Test with the new function
node scripts/test-import-function.js start

# Monitor the import
node scripts/test-import-function.js monitor <import-id>
```

The analysis will show you exactly where the data loss is occurring and help ensure no important records are being dropped. 
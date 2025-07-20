import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  TextField,
  Button,
  Box,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Search, Tune } from '@mui/icons-material';
import { usePropertyStore } from '../stores/StoreContext';

const SearchSection: React.FC = observer(() => {
  const propertyStore = usePropertyStore();
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    propertyStore.setSearchQuery(event.target.value);
  };

  const handleFilterChange = (field: string, value: string | number) => {
    propertyStore.setSearchFilters({ [field]: value });
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Enter your name (e.g., John Smith)"
          value={propertyStore.searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: '#26A69A' }} />,
          }}
          sx={{ 
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '3px',
              height: '64px',
              fontSize: '1.125rem',
              fontWeight: 500,
              '& fieldset': {
                borderWidth: '2px',
                borderColor: '#26A69A',
              },
              '&:hover fieldset': {
                borderColor: '#1D7874',
                borderWidth: '2px',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#1D7874',
                borderWidth: '2px',
              },
            },
            '& .MuiInputBase-input': {
              fontWeight: 500,
            },
          }}
        />
        {/* <Button
          variant="outlined"
          startIcon={<Tune />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{ 
            height: '64px', 
            minWidth: '200px',
            borderWidth: '2px',
            borderColor: '#26A69A',
            color: '#26A69A',
            fontWeight: 600,
            fontSize: '1rem',
            borderRadius: '3px',
            '&:hover': {
              borderWidth: '2px',
              backgroundColor: 'rgba(38, 166, 154, 0.1)',
            },
          }}
        >
          Advanced Filters
        </Button> */}
      </Stack>

      {showFilters && (
        <Accordion expanded sx={{ mt: 2, boxShadow: 1, borderRadius: '3px', overflow: 'hidden' }}>
          <AccordionSummary>
            <Typography variant="h6">Search Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Minimum Amount ($)"
                  type="number"
                  value={propertyStore.searchFilters.minAmount || ''}
                  onChange={(e) => handleFilterChange('minAmount', Number(e.target.value))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}
                />
                <TextField
                  fullWidth
                  label="Maximum Amount ($)"
                  type="number"
                  value={propertyStore.searchFilters.maxAmount || ''}
                  onChange={(e) => handleFilterChange('maxAmount', Number(e.target.value))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}
                />
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="City"
                  value={propertyStore.searchFilters.city || ''}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}
                />
                <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '3px' } }}>
                  <InputLabel>Property Type</InputLabel>
                  <Select
                    value={propertyStore.searchFilters.propertyType || ''}
                    label="Property Type"
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="BANK">Bank Accounts</MenuItem>
                    <MenuItem value="INSURANCE">Insurance</MenuItem>
                    <MenuItem value="UTILITY">Utility Deposits</MenuItem>
                    <MenuItem value="WAGES">Wages</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      {propertyStore.error && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography color="error">{propertyStore.error}</Typography>
        </Box>
      )}
    </Box>
  );
});

export default SearchSection; 
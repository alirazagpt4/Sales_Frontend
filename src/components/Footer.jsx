import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const Footer = () => {
  return (
    <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto' }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary" align="center">
        {'© 2026 Farm Solutions. All rights reserved.'}
      </Typography>
    </Box>
  );
};

export default Footer;
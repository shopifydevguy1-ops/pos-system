const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
});

module.exports = (req, res) => {
  res.status(200).json({
    message: 'Welcome to the API root!',
    routes: ['/api/auth', '/api/users', '/api-docs'],
  });
};
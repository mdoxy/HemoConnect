/**
 * ROUTES INDEX
 * HemoConnect - Smart Blood Donation Platform
 * 
 * Central file exporting all route modules
 * Used in app.js to mount routes with prefixes
 */

const authRoutes = require('./authRoutes');
const donorRoutes = require('./donorRoutes');
const patientRoutes = require('./patientRoutes');
const hospitalRoutes = require('./hospitalRoutes');
const bloodRequestRoutes = require('./bloodRequestRoutes');
const campaignRoutes = require('./campaignRoutes');

module.exports = {
  authRoutes,
  donorRoutes,
  patientRoutes,
  hospitalRoutes,
  bloodRequestRoutes,
  campaignRoutes,
};

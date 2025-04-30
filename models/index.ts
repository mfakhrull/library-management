// Import all models in the correct order
import './User';
import './Author';
import './Category';
import './Book';
import './Borrowing';
import './FineSettings';
import './FinePayment';
import './Reservation';

// Export a dummy function to ensure this file is executed
export function registerModels() {
  // Models are registered by their imports above
  console.log('All models registered');
}
// utils/fileUtils.js or at the top of your controller file
import fs from 'fs';
import path from 'path';

export default (relativePath) => {
  if (!relativePath) return;

  // 1. Construct the full path to the file on your hard drive
  // Assuming your 'uploads' folder is in the root of your project
  const fullPath = path.join(__dirname, '..', relativePath); 

  // 2. Check if file exists, then delete it
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.unlink(fullPath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        else console.log('Successfully deleted file:', relativePath);
      });
    }
  });
};
const express = require('express');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const csvParser = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');

// Create Express app
const app = express();

// Use bodyParser for form submissions
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Meal plan and grocery data (initially empty, admin will upload them)
let mealPlan = [];
let groceryList = [];
let gratitudeEntriesByDate = {};
let sleepLogs = [];

// Multer setup for meal photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/meals');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// ---------------------
// Shivani Routes
// ---------------------

// Serve Shivani login page
app.get('/shivani-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shivani-login.html'));
});

// Serve Shivani dashboard page
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve Shivani meal planner
app.get('/meal-planner', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'meal-planner.html'));
});

// Fetch meal plan for Shivani
app.get('/get-meal-plan', (req, res) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Ensure meal plan has exactly 7 entries for each day of the week
  const cleanedMealPlan = daysOfWeek.map((day, index) => {
    const mealData = mealPlan[index] || {};
    return {
      day: day,
      breakfast: mealData.breakfast || mealData.Breakfast || 'N/A',
      lunch: mealData.lunch || mealData.Lunch || 'N/A',
      dinner: mealData.dinner || mealData.Dinner || 'N/A'
    };
  });

  res.json(cleanedMealPlan);
});

// Upload meal photo for Shivani
app.post('/upload-meal-photo/:day', upload.single('mealPhoto'), (req, res) => {
  const day = req.params.day;
  console.log(`Meal photo for ${day} uploaded:`, req.file);
  res.send(`Meal photo for ${day} uploaded!`);
});

// Serve Shivani's grocery list
app.get('/grocery-list', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'grocery-list.html'));
});

// Fetch grocery list for Shivani
app.get('/get-grocery-list', (req, res) => {
  const cleanedGroceryList = groceryList.map((item, index) => ({
    id: index,
    name: item.name || item.Name || 'N/A',
    quantity: item.quantity || item.Quantity || 'N/A',
    checked: item.checked || false
  }));

  res.json(cleanedGroceryList);
});

// ---------------------
// Routine Planner
// ---------------------

// Serve routine planner page
app.get('/routine-planner', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'routine.html'));
});

// Add task to routine planner
let dailyRoutine = [];
app.post('/add-task', (req, res) => {
  const { task, time } = req.body;
  dailyRoutine.push({ task, time });
  res.json({ success: true, message: 'Task added successfully!', routine: dailyRoutine });
});

// ---------------------
// Gratitude Journal
// ---------------------

// Serve gratitude journal page
app.get('/gratitude-journal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gratitude-journal.html'));
});

// Add gratitude entries for a specific date
app.post('/add-gratitude', (req, res) => {
  const { entryDate, entry1, entry2, entry3 } = req.body;

  if (!gratitudeEntriesByDate[entryDate]) {
    gratitudeEntriesByDate[entryDate] = { entry1, entry2, entry3 };
  } else {
    gratitudeEntriesByDate[entryDate] = { entry1, entry2, entry3 };
  }

  res.json({ success: true, message: 'Gratitude entries saved successfully!', entries: gratitudeEntriesByDate });
});

// Fetch gratitude entries for a specific date
app.get('/get-gratitude-entries', (req, res) => {
  const entryDate = req.query.date;
  const entries = gratitudeEntriesByDate[entryDate] || null;
  res.json(entries);
});

// ---------------------
// Sleep Tracker
// ---------------------

// Serve sleep tracker page
app.get('/sleep-tracker', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sleep-tracker.html'));
});

// Log sleep and wake times
app.post('/log-sleep', (req, res) => {
    const { action, time } = req.body;
    const logTime = time ? new Date(time).toISOString() : new Date().toISOString();  // Ensure time is stored in ISO format
  
    sleepLogs.push({ action, time: logTime });
    res.json({ success: true, message: `Logged ${action} time successfully at ${logTime}`, sleepLogs });
  });
  
  
  // Fetch last 15 days of sleep logs
  app.get('/get-sleep-logs', (req, res) => {
    const last15DaysLogs = sleepLogs.slice(-15);  // Fetch the last 15 logs
    res.json(last15DaysLogs);
  });

  // Route to delete an individual sleep log entry by index
app.post('/delete-sleep-log', (req, res) => {
    const { index } = req.body;
    if (index >= 0 && index < sleepLogs.length) {
      sleepLogs.splice(index, 1);  // Remove the sleep log at the specified index
      res.json({ success: true, message: 'Sleep log entry deleted successfully.', sleepLogs });
    } else {
      res.status(400).json({ success: false, message: 'Invalid index.' });
    }
  });

  // Define the route to delete a sleep log by index
app.delete('/delete-sleep-log/:index', (req, res) => {
    const index = parseInt(req.params.index);

    if (index >= 0 && index < sleepLogs.length) {
        // Remove the log at the specified index
        sleepLogs.splice(index, 1);
        res.json({ success: true, message: 'Sleep log deleted successfully!' });
    } else {
        res.status(404).json({ success: false, message: 'Sleep log not found.' });
    }
});


  
  

// ---------------------
// To-Do List
// ---------------------

// Serve to-do list page
app.get('/to-do-list', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'to-do-list.html'));
});

// Add task to to-do list
let toDoList = [];
app.post('/add-todo', (req, res) => {
  const { task, deadline } = req.body;
  toDoList.push({ task, deadline });
  res.json({ success: true, message: 'To-do task added successfully!', toDoList });
});

// ---------------------
// Admin Routes
// ---------------------

// Serve Admin login page
app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Serve Admin dashboard
app.get('/admin-panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});

// Upload meal plan (.csv or .xlsx)
app.post('/upload-meal-plan', upload.single('mealPlanFile'), (req, res) => {
  const filePath = req.file.path;
  const fileExt = path.extname(req.file.originalname).toLowerCase();

  if (fileExt === '.csv') {
    const newMealPlan = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        newMealPlan.push(row);
      })
      .on('end', () => {
        mealPlan = newMealPlan;
        fs.unlinkSync(filePath);
        res.send('Meal plan uploaded and processed from CSV.');
      });
  } else if (fileExt === '.xlsx') {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    mealPlan = sheetData;
    fs.unlinkSync(filePath);
    res.send('Meal plan uploaded and processed from XLSX.');
  } else {
    fs.unlinkSync(filePath);
    res.status(400).send('Unsupported file format. Only .csv or .xlsx files allowed.');
  }
});

// Upload grocery list (.csv or .xlsx) with quantity
app.post('/upload-grocery', upload.single('groceryFile'), (req, res) => {
  const filePath = req.file.path;
  const fileExt = path.extname(req.file.originalname).toLowerCase();

  if (fileExt === '.csv') {
    const newGroceryList = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        newGroceryList.push({
          name: row.Name || row.name || 'N/A',
          quantity: row.Quantity || row.quantity || 'N/A',
          checked: false
        });
      })
      .on('end', () => {
        groceryList = newGroceryList;
        fs.unlinkSync(filePath);
        res.send('Grocery list uploaded and processed from CSV.');
      });
  } else if (fileExt === '.xlsx') {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    groceryList = sheetData.map(row => ({
      name: row.Name || row.name || 'N/A',
      quantity: row.Quantity || row.quantity || 'N/A',
      checked: false
    }));

    fs.unlinkSync(filePath);
    res.send('Grocery list uploaded and processed from XLSX.');
  } else {
    fs.unlinkSync(filePath);
    res.status(400).send('Unsupported file format. Only .csv or .xlsx files allowed.');
  }
});

// Fetch grocery list with quantity
app.get('/get-grocery-list', (req, res) => {
  const cleanedGroceryList = groceryList.map((item, index) => ({
    id: index,  // Assign index as ID
    name: item.name || item.Name || 'N/A',
    quantity: item.quantity || item.Quantity || 'N/A',
    checked: item.checked || false
  }));

  console.log('Grocery List Sent to Frontend:', cleanedGroceryList);  // Log the grocery list being sent to frontend
  res.json(cleanedGroceryList);
});

// ---------------------
// Start Server
// ---------------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


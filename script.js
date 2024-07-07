// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD8NJtsuvqDAGZa2hWUoAu7_I_36HWwcFg",
    authDomain: "rfid-6f2af.firebaseapp.com",
    databaseURL: "https://rfid-6f2af-default-rtdb.firebaseio.com",
    projectId: "rfid-6f2af",
    storageBucket: "rfid-6f2af.appspot.com",
    messagingSenderId: "475096636580",
    appId: "1:475096636580:web:d5e5dbb792562f5f991a31",
    measurementId: "G-3R389S91LB"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();




function fetchAttendanceRecords() {
    // Firebase initialization and data fetching logic
    // Example:
    const ref = firebase.database().ref('attendance');
    ref.once('value', function(snapshot) {
        // Process snapshot data and update the DOM
    });
}




// Function to filter attendance records based on criteria
function filterAttendanceRecords(studentName, startDate, endDate) {
    // Debugging: Log the received dates
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    const filteredRecordsDiv = document.getElementById('filteredRecords');
    filteredRecordsDiv.innerHTML = ''; // Clear previous content

    let ref = database.ref('attendance');

    // Apply filters if provided
    if (studentName !== '') {
        ref = ref.orderByChild('studentName').equalTo(studentName);
    }

    if (startDate !== '' && endDate !== '') {
        // Parse and validate dates
        const startTimestamp = Date.parse(startDate); // Example: '07/04/2024'
        const endTimestamp = Date.parse(endDate);

        // Check if dates are valid before proceeding
        if (!isNaN(startTimestamp) && !isNaN(endTimestamp)) {
            ref = ref.startAt(startTimestamp).endAt(endTimestamp);
        } else {
            console.error('Invalid date format or range.');
            return; // Exit function if dates are invalid
        }
    }

    // Fetch filtered records from Firebase
    ref.once('value', function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const record = childSnapshot.val();
            const studentName = record.studentName;
            const timestamp = new Date(record.timestamp);
            const lectureDate = timestamp.toLocaleDateString();
            const lectureTime = timestamp.toLocaleTimeString();

            const recordDiv = document.createElement('div');
            recordDiv.classList.add('attendance-record');
            recordDiv.innerHTML = `
                <p><strong>Student Name:</strong> ${studentName}</p>
                <p><strong>Date:</strong> ${lectureDate}</p>
                <p><strong>Time:</strong> ${lectureTime}</p>
            `;
            filteredRecordsDiv.appendChild(recordDiv);
        });

        if (!snapshot.exists()) {
            // Display message if no records found
            filteredRecordsDiv.innerHTML = '<p>No attendance records found matching the criteria.</p>';
        }
    });
}


// Event listener for form submission
document.addEventListener('DOMContentLoaded', function() {
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get filter criteria
            const studentName = document.getElementById('studentNameFilter').value.trim();
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;

            // Filter attendance records
            filterAttendanceRecords(studentName, startDate, endDate);
        });
    } else {
        console.error('Form filterForm not found.');
    }
});


// Function to add attendance record manually
document.addEventListener('DOMContentLoaded', function() {
    const addAttendanceForm = document.getElementById('addAttendanceForm');
    if (addAttendanceForm) {
        addAttendanceForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get form values
            const studentName = document.getElementById('studentName').value.trim();
            const lectureDate = document.getElementById('lectureDate').value.trim();
            const lectureTime = document.getElementById('lectureTime').value.trim();

            if (studentName && lectureDate && lectureTime) {
                // Construct timestamp
                const timestamp = new Date(`${lectureDate}T${lectureTime}:00`).toISOString();

                // Save to Firebase
                const newRecordRef = database.ref('attendance').push();
                newRecordRef.set({
                    studentName: studentName,
                    timestamp: timestamp
                }).then(() => {
                    alert('Attendance record added successfully!');
                    addAttendanceForm.reset();
                }).catch((error) => {
                    console.error('Error adding attendance record: ', error);
                    alert('Failed to add attendance record. Please try again.');
                });
            } else {
                alert('Please fill in all fields.');
            }
        });
    } else {
        console.error('Form addAttendanceForm not found.');
    }
});

// Function to delete attendance record manually
document.addEventListener('DOMContentLoaded', function() {
    const deleteAttendanceForm = document.getElementById('deleteAttendanceForm');
    if (deleteAttendanceForm) {
        deleteAttendanceForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Get student name to delete
            const studentNameToDelete = document.getElementById('studentNameToDelete').value.trim();

            if (studentNameToDelete) {
                // Search for attendance records by student name
                const ref = database.ref('attendance');
                ref.orderByChild('studentName').equalTo(studentNameToDelete).once('value', function(snapshot) {
                    snapshot.forEach(function(childSnapshot) {
                        // Remove attendance record
                        ref.child(childSnapshot.key).remove();
                    });
                    alert('Attendance record(s) deleted successfully!');
                    deleteAttendanceForm.reset();
                });
            } else {
                alert('Please enter a Student Name to delete records.');
            }
        });
    } else {
        console.error('Form deleteAttendanceForm not found.');
    }
});


function generateDefaulterReport() {
    const defaulterList = document.getElementById('defaulterList');
    if (!defaulterList) {
        console.error('Element with ID "defaulterList" not found.');
        return; // Exit function if defaulterList element is not found
    }

    defaulterList.innerHTML = ''; // Clear previous content

    const studentAttendance = {}; // Object to store attended lectures per student
    const lecturesCount = {}; // Object to store total lectures per teacher

    // Step 1: Fetch all attendance records
    database.ref('attendance').once('value', function(attendanceSnapshot) {
        console.log('Attendance Snapshot:', attendanceSnapshot.val()); // Log attendance data

        // Calculate attended lectures per student
        attendanceSnapshot.forEach(function(childSnapshot) {
            const record = childSnapshot.val();
            const studentName = record.studentName;

            // Increment attended lectures count for the respective student
            if (!studentAttendance.hasOwnProperty(studentName)) {
                studentAttendance[studentName] = 0;
            }
            studentAttendance[studentName]++;
        });

        // Step 2: Fetch all lectures
        database.ref('lectures').once('value', function(lecturesSnapshot) {
            console.log('Lectures Snapshot:', lecturesSnapshot.val()); // Log lectures data

            // Calculate total lectures per teacher
            lecturesSnapshot.forEach(function(lectureSnapshot) {
                const lecture = lectureSnapshot.val();
                const teacherName = lecture.teacherName;

                // Increment total lectures count for the respective teacher
                if (!lecturesCount.hasOwnProperty(teacherName)) {
                    lecturesCount[teacherName] = 0;
                }
                lecturesCount[teacherName]++;
            });

            // Loop through students to calculate attendance and determine defaulters
            let foundDefaulters = false; // Flag to track if any defaulters are found

            for (const studentName in studentAttendance) {
                if (studentAttendance.hasOwnProperty(studentName)) {
                    const attendedLectures = studentAttendance[studentName];
                    const totalStudentLectures = Object.values(lecturesCount).reduce((a, b) => a + b, 0); // Sum of all teacher lectures
                    const attendancePercentage = (attendedLectures / totalStudentLectures) * 100 || 0;

                    console.log(`Student: ${studentName}, Attended Lectures: ${attendedLectures}, Total Lectures: ${totalStudentLectures}, Attendance Percentage: ${attendancePercentage}`);

                    // Determine if student is a defaulter based on attendance percentage
                    let listItemClass = 'non-defaulter';
                    if (attendancePercentage < 75) {
                        listItemClass = 'defaulter';
                        foundDefaulters = true; // Set flag to true if any defaulters are found
                    }

                    // Create a new div for each student's attendance details
                    const listItem = document.createElement('div');
                    listItem.classList.add('attendance-item', listItemClass);
                    listItem.innerHTML = `
                        <p><strong>Student Name:</strong> ${studentName}</p>
                        <p><strong>Attended Lectures:</strong> ${attendedLectures}</p>
                        <p><strong>Total Lectures:</strong> ${totalStudentLectures}</p>
                        <p><strong>Attendance Percentage:</strong> ${attendancePercentage.toFixed(2)}%</p>
                    `;
                    defaulterList.appendChild(listItem);
                }
            }

            // Display message if no defaulters found
            if (!foundDefaulters) {
                const noDefaultersMessage = document.createElement('p');
                noDefaultersMessage.textContent = 'No defaulters found.';
                defaulterList.appendChild(noDefaultersMessage);
            }
        });
    });
}


// Call the function to generate the defaulter report on page load or as needed
generateDefaulterReport();





// Function to export attendance records to Excel
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            const ref = database.ref('attendance');

            ref.once('value', function(snapshot) {
                const records = [];
                snapshot.forEach(function(childSnapshot) {
                    const record = childSnapshot.val();
                    records.push({
                        'Student Name': record.studentName,
                        'Date': new Date(record.timestamp).toLocaleDateString(),
                        'Time': new Date(record.timestamp).toLocaleTimeString()
                    });
                });

                if (records.length > 0) {
                    // Convert records to Excel format using xlsx library (example code)
                    const worksheet = XLSX.utils.json_to_sheet(records);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
                    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                    saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), 'attendance_records.xlsx');
                } else {
                    alert('No attendance records found.');
                }
            });
        });
    } else {
        console.error('Export button not found.');
    }
});


// Function to add a new lecture
document.addEventListener('DOMContentLoaded', function() {
    const addLectureForm = document.getElementById('addLectureForm');
    if (addLectureForm) {
        addLectureForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const teacherName = document.getElementById('teacherName').value.trim();
            const lectureDateTime = document.getElementById('lectureDateTime').value.trim();

            const lecturesRef = database.ref('lectures').push();
            lecturesRef.set({
                teacherName: teacherName,
                lectureDateTime: lectureDateTime,
            }).then(() => {
                alert('Lecture added successfully!');
                addLectureForm.reset();
            }).catch((error) => {
                console.error('Error adding lecture: ', error);
                alert('Failed to add lecture. Please try again.');
            });
        });
    } else {
        console.error('Form addLectureForm not found.');
    }
});

// Ensure DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    // Fetch attendance records initially
    fetchAttendanceRecords();
});


// Function to add a new lecture
function addLecture(teacherName, timestamp) {
    const lecturesRef = firebase.database().ref('lectures');
    lecturesRef.push({
        teacher: teacherName,
        timestamp: timestamp
    }).then(() => {
        console.log('Lecture added successfully!');
    }).catch((error) => {
        console.error('Error adding lecture:', error.message);
    });
}



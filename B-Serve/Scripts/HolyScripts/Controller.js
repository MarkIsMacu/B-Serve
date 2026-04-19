// Controller.js - All the actions on every page happen here
app.controller("BSRMSController", function ($scope, BSRMSService) {

    // ================================================================
    // NAVIGATION - go to a different page
    // ================================================================
    $scope.goTo = function (pageName) {
        window.location.href = "/BSRMS/" + pageName;
    };

    // ================================================================
    // PASSWORD STRENGTH CHECK
    // ================================================================
    $scope.isPasswordStrong = function (password) {
        if (!password || password.length < 8) return false;
        var hasUpper = /[A-Z]/.test(password);
        var hasLower = /[a-z]/.test(password);
        var hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
        return hasUpper && hasLower && hasSpecial;
    };

    // ================================================================
    // REGISTRATION FORM VALIDATION
    // ================================================================
    $scope.isFormValid = function () {
        return $scope.FName && $scope.LName && $scope.Contact &&
               $scope.Gender && $scope.BlkLot && $scope.Street &&
               $scope.Purok && $scope.RegUsername && $scope.RegPassword && $scope.RegConfirmPassword;
    };

    // ================================================================
    // REGISTRATION - save a new resident into the database
    // ================================================================
    $scope.saveUser = function () {
        if ($scope.Contact && $scope.Contact.length !== 11) {
            Swal.fire("Invalid Contact Number", "Please enter a valid 11-digit mobile number (e.g. 09123456789).", "warning");
            return;
        }
        if ($scope.RegPassword !== $scope.RegConfirmPassword) {
            Swal.fire("Error", "Passwords do not match!", "error");
            return;
        }
        if (!$scope.isPasswordStrong($scope.RegPassword)) {
            Swal.fire("Weak Password", "Password must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 special character.", "warning");
            return;
        }

        var userData = {
            firstName: $scope.FName,
            middleName: $scope.MName || "",
            lastName: $scope.LName,
            contactNumber: $scope.Contact,
            blkLot: $scope.BlkLot,
            street: $scope.Street,
            username: $scope.RegUsername,
            password: $scope.RegPassword
        };

        BSRMSService.RegisterUser(userData, $scope.Gender, $scope.Purok).then(function (response) {
            if (response.data.success) {
                Swal.fire({ title: "Registration Submitted!", text: response.data.message, icon: "info", confirmButtonColor: "#1976D2" })
                    .then(function () { $scope.goTo("LogIn"); });
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        }).catch(function () {
            Swal.fire("Server Error", "Could not connect to database.", "error");
        });
    };

    // ================================================================
    // LOGIN - check credentials then redirect based on role
    // ================================================================
    $scope.login = function () {
        BSRMSService.LoginUser($scope.LoginUser, $scope.LoginPass).then(function (response) {
            if (response.data.success) {
                var user = response.data;

                // Save who is logged in so other pages can use it
                sessionStorage.setItem("LoggedInUser", user.username);
                sessionStorage.setItem("LoggedInRole", user.role);

                if (user.role === "Admin") {
                    $scope.goTo("HomeDashboard");
                } else if (user.role === "Resident") {
                    if (user.status === "Pending") {
                        Swal.fire("Pending", "Your account is still waiting for Admin verification.", "warning");
                    } else if (user.status === "Verified") {
                        Swal.fire("Success", "You are now logged in.", "success")
                            .then(function () { $scope.goTo("ResidentDashboard"); });
                    } else {
                        Swal.fire("Rejected", "Your account has been rejected. Contact the admin.", "error");
                    }
                }
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        }).catch(function () {
            Swal.fire("Server Error", "Could not connect to database.", "error");
        });
    };

    // ================================================================
    // ADMIN APPROVAL PAGE - load pending residents from database
    // ================================================================
    $scope.userArray = [];

    $scope.loadAllUsers = function () {
        BSRMSService.GetAllUsers().then(function (response) {
            if (response.data.success) {
                $scope.userArray = response.data.data;
                // Redraw charts once user data is also available
                setTimeout($scope.drawCharts, 100);
            }
        });
    };

    // Call loadAllUsers automatically when page loads (for Approval and Users pages)
    $scope.loadAllUsers();

    // Approve a resident
    $scope.verifyUser = function (user) {
        BSRMSService.ApproveUser(user.usersID).then(function (response) {
            if (response.data.success) {
                Swal.fire("Approved!", "Resident can now log in.", "success");
                $scope.loadAllUsers(); // Refresh the list
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        });
    };

    // Reject a pending resident
    $scope.rejectUser = function (user) {
        BSRMSService.RejectUser(user.usersID).then(function (response) {
            if (response.data.success) {
                Swal.fire("Rejected", "Registration rejected and removed.", "info");
                $scope.loadAllUsers();
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        });
    };

    // Delete a verified resident
    $scope.deleteUser = function (user) {
        BSRMSService.DeleteUser(user.usersID).then(function (response) {
            if (response.data.success) {
                Swal.fire("Deleted", "Resident record deleted.", "warning");
                $scope.loadAllUsers();
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        });
    };

    // ================================================================
    // ADMIN DASHBOARD - count stats for the home dashboard
    // ================================================================
    $scope.getTotalVerifiedResidents = function () {
        var count = 0;
        for (var i = 0; i < $scope.userArray.length; i++) {
            if ($scope.userArray[i].Role === "Resident" && $scope.userArray[i].Status === "Verified") count++;
        }
        return count;
    };

    $scope.countRequests = function (statusToFind) {
        var count = 0;
        for (var i = 0; i < $scope.requestArray.length; i++) {
            if ($scope.requestArray[i].Status === statusToFind) count++;
        }
        return count;
    };

    // Stamp date and open print dialog
    $scope.generatePDFReport = function () {
        var now = new Date();
        var opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        var dateStr = now.toLocaleDateString('en-PH', opts) + '  ' + now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
        var el = document.getElementById('print-date');
        if (el) el.textContent = dateStr;
        window.print();
    };

    // Helper: resolution %, pending %, on-going % — used by the dashboard HTML
    $scope.currentYear = new Date().getFullYear();

    $scope.getResolutionRate = function () {
        if ($scope.requestArray.length === 0) return 0;
        return Math.round(($scope.countRequests('Resolved') / $scope.requestArray.length) * 100);
    };

    $scope.getPendingRate = function () {
        if ($scope.requestArray.length === 0) return 0;
        return Math.round(($scope.countRequests('Pending') / $scope.requestArray.length) * 100);
    };

    $scope.getOngoingRate = function () {
        if ($scope.requestArray.length === 0) return 0;
        return Math.round(($scope.countRequests('On-going') / $scope.requestArray.length) * 100);
    };

    // Helper: percentage of a count vs total requests (for print report)
    $scope.getPct = function (count) {
        if ($scope.requestArray.length === 0) return '0%';
        return Math.round(count / $scope.requestArray.length * 100) + '%';
    };

    // Helper: group requests by category — used in print report
    $scope.getCategoryBreakdown = function () {
        var counts = {};
        for (var i = 0; i < $scope.requestArray.length; i++) {
            var type = $scope.requestArray[i].Type || 'Other';
            counts[type] = (counts[type] || 0) + 1;
        }
        var result = [];
        var keys = Object.keys(counts);
        for (var j = 0; j < keys.length; j++) {
            result.push({ type: keys[j], count: counts[keys[j]] });
        }
        return result;
    };

    // Helper: monthly request + user registration counts for current year
    $scope.getMonthlyBreakdown = function () {
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var reqCounts  = [0,0,0,0,0,0,0,0,0,0,0,0];
        var userCounts = [0,0,0,0,0,0,0,0,0,0,0,0];
        var yr = new Date().getFullYear().toString();
        for (var i = 0; i < $scope.requestArray.length; i++) {
            if (!$scope.requestArray[i].CreatedAt) continue;
            var p = $scope.requestArray[i].CreatedAt.split('-');
            if (p[0] === yr) reqCounts[parseInt(p[1]) - 1]++;
        }
        for (var j = 0; j < $scope.userArray.length; j++) {
            if (!$scope.userArray[j].CreatedAt) continue;
            var q = $scope.userArray[j].CreatedAt.split('-');
            if (q[0] === yr) userCounts[parseInt(q[1]) - 1]++;
        }
        var result = [];
        for (var k = 0; k < months.length; k++) {
            result.push({ month: months[k], reqCount: reqCounts[k], userCount: userCounts[k] });
        }
        return result;
    };

    // ================================================================
    // ADMIN USERS - manual user form
    // ================================================================
    $scope.showUserForm = false;
    $scope.userEditMode = false;
    $scope.tempUser = {};

    $scope.openAddUserForm = function () {
        $scope.showUserForm = true;
        $scope.userEditMode = false;
        $scope.tempUser = {};
    };

    $scope.triggerEditUser = function (user) {
        $scope.showUserForm = true;
        $scope.userEditMode = true;
        $scope.tempUser = angular.copy(user);
    };

    // Admin adding a new resident manually (uses the same registration endpoint)
    $scope.adminSaveUser = function () {
        if ($scope.tempUser.Contact && $scope.tempUser.Contact.length !== 11) {
            Swal.fire("Invalid Contact Number", "Please enter a valid 11-digit mobile number.", "warning");
            return;
        }
        if (!$scope.userEditMode && !$scope.isPasswordStrong($scope.tempUser.Password)) {
            Swal.fire("Weak Password", "Password must be at least 8 characters, 1 uppercase, 1 lowercase, and 1 special character.", "warning");
            return;
        }

        var userData = {
            firstName: $scope.tempUser.FirstName,
            middleName: $scope.tempUser.MiddleName || "",
            lastName: $scope.tempUser.LastName,
            contactNumber: $scope.tempUser.Contact,
            blkLot: $scope.tempUser.BlkLot,
            street: $scope.tempUser.Street,
            username: $scope.tempUser.Username,
            password: $scope.tempUser.Password
        };

        BSRMSService.RegisterUser(userData, $scope.tempUser.Gender, $scope.tempUser.Purok).then(function (response) {
            if (response.data.success) {
                // After adding, approve them automatically (admin adds are always verified)
                BSRMSService.GetAllUsers().then(function (r) {
                    var addedUser = r.data.data.filter(function(u) { return u.Username === userData.username; })[0];
                    if (addedUser) {
                        BSRMSService.ApproveUser(addedUser.usersID).then(function () {
                            Swal.fire("Added", "Resident added and verified.", "success");
                            $scope.loadAllUsers();
                            $scope.showUserForm = false;
                        });
                    }
                });
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        });
    };

    // ================================================================
    // ADMIN REQUESTS - load and manage service requests
    // ================================================================
    $scope.requestArray = [];
    $scope.currentReqFilter = '';

    // Keep references so we can destroy and redraw charts when data refreshes
    var statusChartInstance       = null;
    var categoryChartInstance     = null;
    var requestTrendChartInstance = null;
    var userTrendChartInstance    = null;

    $scope.setReqFilter = function (status) {
        $scope.currentReqFilter = status;
    };

    $scope.hasFilteredRequests = function () {
        if ($scope.currentReqFilter === '') return $scope.requestArray.length > 0;
        for (var i = 0; i < $scope.requestArray.length; i++) {
            if ($scope.requestArray[i].Status === $scope.currentReqFilter) return true;
        }
        return false;
    };

    $scope.loadAllRequests = function () {
        BSRMSService.GetAllRequests().then(function (response) {
            if (response.data.success) {
                $scope.requestArray = response.data.data;
                // Wait for AngularJS to finish rendering, then draw the charts
                setTimeout($scope.drawCharts, 100);
            }
        });
    };

    // Draw all 4 dashboard charts using live data
    $scope.drawCharts = function () {
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var currentYear = new Date().getFullYear().toString();

        // Helper: group any array by month for the current year
        function countByMonth(array, dateField) {
            var counts = [0,0,0,0,0,0,0,0,0,0,0,0];
            for (var i = 0; i < array.length; i++) {
                if (!array[i][dateField]) continue;
                var parts = array[i][dateField].split('-'); // e.g. "2026-04"
                if (parts[0] === currentYear) {
                    counts[parseInt(parts[1]) - 1]++;
                }
            }
            return counts;
        }

        var pending  = $scope.countRequests('Pending');
        var ongoing  = $scope.countRequests('On-going');
        var resolved = $scope.countRequests('Resolved');

        // Count requests per category for horizontal bar
        var categoryCounts = {};
        for (var i = 0; i < $scope.requestArray.length; i++) {
            var type = $scope.requestArray[i].Type || 'Other';
            categoryCounts[type] = (categoryCounts[type] || 0) + 1;
        }
        var categoryLabels = Object.keys(categoryCounts);
        var categoryValues = [];
        for (var j = 0; j < categoryLabels.length; j++) {
            categoryValues.push(categoryCounts[categoryLabels[j]]);
        }

        var monthlyRequests = countByMonth($scope.requestArray, 'CreatedAt');
        var monthlyUsers    = countByMonth($scope.userArray,    'CreatedAt');

        // 1. Monthly Request Trend — Line chart (full-width)
        var reqTrendCanvas = document.getElementById('requestTrendChart');
        if (reqTrendCanvas) {
            if (requestTrendChartInstance) requestTrendChartInstance.destroy();
            requestTrendChartInstance = new Chart(reqTrendCanvas, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Requests',
                        data: monthlyRequests,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99,102,241,0.07)',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#6366f1',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' } },
                        y: { grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, font: { size: 10, weight: 'bold' }, color: '#94a3b8' }, beginAtZero: true }
                    }
                }
            });
        }

        // 2. Status Donut chart
        var statusCanvas = document.getElementById('statusChart');
        if (statusCanvas) {
            if (statusChartInstance) statusChartInstance.destroy();
            statusChartInstance = new Chart(statusCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Pending', 'On-going', 'Resolved'],
                    datasets: [{
                        data: [pending, ongoing, resolved],
                        backgroundColor: ['#fbbf24', '#6366f1', '#10b981'],
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '68%',
                    plugins: { legend: { display: false } }
                }
            });
        }

        // 3. Category Horizontal Bar chart
        var categoryCanvas = document.getElementById('categoryChart');
        if (categoryCanvas) {
            if (categoryChartInstance) categoryChartInstance.destroy();
            categoryChartInstance = new Chart(categoryCanvas, {
                type: 'bar',
                data: {
                    labels: categoryLabels,
                    datasets: [{
                        label: 'Requests',
                        data: categoryValues,
                        backgroundColor: ['rgba(99,102,241,0.75)','rgba(16,185,129,0.75)','rgba(251,191,36,0.75)','rgba(239,68,68,0.75)','rgba(139,92,246,0.75)'],
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, font: { size: 10, weight: 'bold' }, color: '#94a3b8' }, beginAtZero: true },
                        y: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#475569' } }
                    }
                }
            });
        }

        // 4. Monthly User Registration Trend — Line chart
        var userTrendCanvas = document.getElementById('userTrendChart');
        if (userTrendCanvas) {
            if (userTrendChartInstance) userTrendChartInstance.destroy();
            userTrendChartInstance = new Chart(userTrendCanvas, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Registrations',
                        data: monthlyUsers,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16,185,129,0.07)',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#10b981',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' } },
                        y: { grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, font: { size: 10, weight: 'bold' }, color: '#94a3b8' }, beginAtZero: true }
                    }
                }
            });
        }
    };

    // Load automatically for admin requests page
    $scope.loadAllRequests();

    $scope.showReqForm = false;
    $scope.reqEditMode = false;
    $scope.tempReq = {};

    $scope.openAddReqForm = function () {
        $scope.showReqForm = true;
        $scope.reqEditMode = false;
        $scope.tempReq = { Status: "Pending", AdminFeedback: "" };
    };

    $scope.triggerEditRequest = function (req) {
        $scope.showReqForm = true;
        $scope.reqEditMode = true;
        $scope.tempReq = angular.copy(req);
    };

    $scope.adminSaveRequest = function () {
        BSRMSService.UpdateRequest($scope.tempReq.requestsID, $scope.tempReq.Status, $scope.tempReq.AdminFeedback).then(function (response) {
            if (response.data.success) {
                Swal.fire("Updated", "Request updated successfully.", "success");
                $scope.loadAllRequests();
                $scope.showReqForm = false;
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        });
    };

    $scope.deleteRequest = function (req) {
        Swal.fire({
            title: "Delete this request?",
            text: "This will permanently remove the request from the system.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, delete it"
        }).then(function (result) {
            if (result.isConfirmed) {
                BSRMSService.DeleteRequest(req.requestsID).then(function (response) {
                    if (response.data.success) {
                        Swal.fire("Deleted", "The request has been removed.", "success");
                        $scope.loadAllRequests();
                    } else {
                        Swal.fire("Error", response.data.message, "error");
                    }
                }).catch(function () {
                    Swal.fire("Server Error", "Could not connect to database.", "error");
                });
            }
        });
    };

    // ================================================================
    // RESIDENT DASHBOARD - load and submit resident requests
    // ================================================================
    $scope.myRequests = [];

    $scope.loadMyRequests = function () {
        var me = sessionStorage.getItem("LoggedInUser");
        if (!me) return;

        BSRMSService.GetMyRequests(me).then(function (response) {
            if (response.data.success) {
                $scope.myRequests = response.data.data;
            }
        });
    };

    // Resident submits a new request
    $scope.submitRequest = function () {
        var me = sessionStorage.getItem("LoggedInUser");
        BSRMSService.SubmitRequest(me, $scope.ReqType, $scope.ReqMessage).then(function (response) {
            if (response.data.success) {
                Swal.fire("Sent!", "Your request has been submitted.", "success");
                $scope.ReqType = "";
                $scope.ReqMessage = "";
                $scope.loadMyRequests(); // Refresh the list
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        }).catch(function () {
            Swal.fire("Server Error", "Could not connect to database.", "error");
        });
    };

    // Redundant function kept for compatibility
    $scope.UpsertFunc = function () {};

});
// Controller.js - All the actions on every page happen here
app.controller("BSRMSController", function ($scope, BSRMSService) {

    // ================================================================
    // NAVIGATION - Dito tayo gumagalaw papunta sa ibang page ng website.
    // ================================================================
    $scope.goTo = function (pageName) {
        var baseUrl = window.appBaseUrl || "/";
        if (!baseUrl.endsWith("/")) baseUrl += "/";
        window.location.href = baseUrl + "BSRMS/" + pageName;
    };

    // ================================================================
    // PASSWORD STRENGTH CHECK - Para ma-check kung safe yung password.
    // ================================================================
    $scope.isPasswordStrong = function (password) {
        if (!password || password.length < 8) return false;
        var hasUpper = /[A-Z]/.test(password);
        var hasLower = /[a-z]/.test(password);
        var hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
        return hasUpper && hasLower && hasSpecial;
    };

    // ================================================================
    // REGISTRATION FORM VALIDATION - I-check kung may laman lahat ng textboxes.
    // ================================================================
    $scope.isFormValid = function () {
        return $scope.FName && $scope.LName && $scope.Contact &&
            $scope.Gender && $scope.BlkLot && $scope.Street &&
            $scope.Purok && $scope.RegUsername && $scope.RegPassword && $scope.RegConfirmPassword;
    };

    // ================================================================
    // REGISTRATION - Isesave yung bagong user sa database kung tama ang input.
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
    // LOGIN - I-verify yung username at password tapos i-redirect sa tamang dashboard.
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
    // ADMIN APPROVAL PAGE - I-load lahat ng residents para makita sa admin table.
    // ================================================================
    $scope.userArray = [];

    // currentPage - ginagamit natin para malaman kung anong page tayo ngayon.
    var currentPage = window.location.pathname;

    $scope.loadAllUsers = function () {
        BSRMSService.GetAllUsers().then(function (response) {
            if (response.data.success) {
                $scope.userArray = response.data.data;
                $scope.updateBreakdowns(); // Pre-calculate for the report
                // I-redraw yung charts ONLY kung nasa Dashboard page tayo.
                if (currentPage.indexOf('HomeDashboard') !== -1) {
                    setTimeout($scope.drawCharts, 100);
                }
            }
        }).catch(function (error) {
            console.error("Failed to load users", error);
        });
    };

    // Approve a resident
    $scope.verifyUser = function (user) {
        BSRMSService.ApproveUser(user.usersID).then(function (response) {
            if (response.data.success) {
                Swal.fire("Approved!", "Resident can now log in.", "success");
                $scope.loadAllUsers(); // Refresh the list
            } else {
                Swal.fire("Error", response.data.message, "error");
            }
        }).catch(function (error) {
            console.error("Verification failed:", error);
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
        }).catch(function (error) {
            console.error("Rejection failed:", error);
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
        }).catch(function (error) {
            console.error("Deletion failed:", error);
        });
    };

    // ================================================================
    // ADMIN DASHBOARD - Para makapag-bilang tayo ng stats sa dashboard.
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
    // Breakdown functions removed - now using pre-calculated variables to avoid infinite digest loops.


    // ================================================================
    // ADMIN USERS - Dito si admin pwedeng mag-add manually ng resident.
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

        var userData = {
            usersID: $scope.tempUser.usersID,
            firstName: $scope.tempUser.FirstName,
            middleName: $scope.tempUser.MiddleName || "",
            lastName: $scope.tempUser.LastName,
            contactNumber: $scope.tempUser.Contact,
            blkLot: $scope.tempUser.BlkLot,
            street: $scope.tempUser.Street,
            username: $scope.tempUser.Username,
            password: $scope.tempUser.Password || ""
        };

        if ($scope.userEditMode) {
            BSRMSService.UpdateUser(userData, $scope.tempUser.Gender, $scope.tempUser.Purok).then(function (response) {
                if (response.data.success) {
                    Swal.fire("Updated", "Resident record updated.", "success");
                    $scope.loadAllUsers();
                    $scope.showUserForm = false;
                } else {
                    Swal.fire("Error", response.data.message, "error");
                }
            }).catch(function (error) {
                console.error("Update failed:", error);
            });
        } else {
            // ADD MODE: I-check password strength bago mag-register ng bago.
            if (!$scope.isPasswordStrong($scope.tempUser.Password)) {
                Swal.fire("Weak Password", "Password must be at least 8 characters, 1 uppercase, 1 lowercase, and 1 special character.", "warning");
                return;
            }
            BSRMSService.RegisterUser(userData, $scope.tempUser.Gender, $scope.tempUser.Purok).then(function (response) {
                if (response.data.success) {
                    // Awtomatikong i-approve ang resident na dinagdag ng admin.
                    BSRMSService.GetAllUsers().then(function (r) {
                        var addedUser = r.data.data.filter(function (u) { return u.Username === userData.username; })[0];
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
            }).catch(function () {
                Swal.fire("Server Error", "Could not connect to database.", "error");
            });
        }
    };


    // ================================================================
    // ADMIN REQUESTS - Dito tayo kukuha at mag-mamanage ng mga service requests.
    // ================================================================
    $scope.requestArray = [];
    $scope.currentReqFilter = '';

    // Keep references so we can destroy and redraw charts when data refreshes
    var statusChartInstance = null;
    var categoryChartInstance = null;
    var requestTrendChartInstance = null;
    var userTrendChartInstance = null;

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
                $scope.updateBreakdowns(); // Pre-calculate for the report
                // I-redraw yung charts ONLY kung nasa Dashboard page tayo.
                if (currentPage.indexOf('HomeDashboard') !== -1) {
                    setTimeout($scope.drawCharts, 100);
                }
            }
        }).catch(function (error) {
            console.error("Failed to load requests", error);
        });
    };

    $scope.categoryBreakdown = [];
    $scope.monthlyBreakdown = [];

    $scope.updateBreakdowns = function () {
        if (!$scope.requestArray) return;
        
        // 1. Category Breakdown
        var counts = {};
        for (var i = 0; i < $scope.requestArray.length; i++) {
            var type = $scope.requestArray[i].Type || 'Other';
            counts[type] = (counts[type] || 0) + 1;
        }
        var catRes = [];
        var keys = Object.keys(counts);
        for (var j = 0; j < keys.length; j++) {
            catRes.push({ type: keys[j], count: counts[keys[j]] });
        }
        $scope.categoryBreakdown = catRes;

        // 2. Monthly Breakdown (Single Pass Optimization)
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var currentYear = new Date().getFullYear().toString();
        var monthlyMap = {};
        
        // Initialize map
        for (var m = 0; m < 12; m++) {
            monthlyMap[m + 1] = { req: 0, user: 0 };
        }

        // Count requests
        for (var k = 0; k < $scope.requestArray.length; k++) {
            var r = $scope.requestArray[k];
            if (r.CreatedAt && r.CreatedAt.indexOf('-') !== -1) {
                var parts = r.CreatedAt.split('-');
                if (parts[0] === currentYear) {
                    var monthIdx = parseInt(parts[1]);
                    if (monthlyMap[monthIdx]) monthlyMap[monthIdx].req++;
                }
            }
        }

        // Count users
        if ($scope.userArray) {
            for (var l = 0; l < $scope.userArray.length; l++) {
                var u = $scope.userArray[l];
                if (u.CreatedAt && u.CreatedAt.indexOf('-') !== -1) {
                    var uparts = u.CreatedAt.split('-');
                    if (uparts[0] === currentYear) {
                        var umonthIdx = parseInt(uparts[1]);
                        if (monthlyMap[umonthIdx]) monthlyMap[umonthIdx].user++;
                    }
                }
            }
        }

        // Convert map to array
        var res = [];
        for (var n = 0; n < 12; n++) {
            res.push({
                month: months[n],
                reqCount: monthlyMap[n + 1].req,
                userCount: monthlyMap[n + 1].user
            });
        }
        $scope.monthlyBreakdown = res;
    };

    // Draw all 4 dashboard charts using live data
    $scope.drawCharts = function () {
        if (typeof Chart === 'undefined') return;

        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var currentYear = new Date().getFullYear().toString();

        // Helper: group any array by month for the current year
        function countByMonth(array, dateField) {
            var counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            for (var i = 0; i < array.length; i++) {
                if (!array[i][dateField]) continue;
                var parts = array[i][dateField].split('-'); // e.g. "2026-04"
                if (parts[0] === currentYear) {
                    counts[parseInt(parts[1]) - 1]++;
                }
            }
            return counts;
        }

        var pending = $scope.countRequests('Pending');
        var ongoing = $scope.countRequests('On-going');
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
        var monthlyUsers = countByMonth($scope.userArray, 'CreatedAt');

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
            var totalRequests = pending + ongoing + resolved;
            statusChartInstance = new Chart(statusCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Pending', 'On-going', 'Resolved'],
                    datasets: [{
                        data: totalRequests === 0 ? [1] : [pending, ongoing, resolved],
                        backgroundColor: totalRequests === 0 ? ['#e2e8f0'] : ['#fbbf24', '#6366f1', '#10b981'],
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
                        backgroundColor: ['rgba(99,102,241,0.75)', 'rgba(16,185,129,0.75)', 'rgba(251,191,36,0.75)', 'rgba(239,68,68,0.75)', 'rgba(139,92,246,0.75)'],
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

    $scope.showReqForm = false;
    $scope.reqEditMode = false;
    $scope.tempReq = {};

    $scope.openAddReqForm = function () {
        $scope.showReqForm = true;
        $scope.reqEditMode = false;
        $scope.tempReq = { Status: "Pending", AdminFeedback: "" };
    };

    $scope.triggerEditRequest = function (req) {
        $scope.tempReq = {}; // Reset first
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
        }).catch(function (error) {
            console.error("Update failed:", error);
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
    // RESIDENT DASHBOARD - Dito maglo-load at magsa-submit si resident ng requests niya.
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

    // ================================================================
    // PAGE-AWARE LOADING - Load lang ang data na kailangan ng current page.
    // Ito ang nagpapabilis ng navigation — hindi na nag-lo-load ng extra data.
    // ================================================================
    if (currentPage.indexOf('HomeDashboard') !== -1) {
        // Dashboard: kailangan lahat — users, requests, at charts.
        $scope.loadAllUsers();
        $scope.loadAllRequests();
    } else if (currentPage.indexOf('AdminApproval') !== -1 ||
        currentPage.indexOf('AdminUsers') !== -1) {
        // Approval at Directory pages: users lang ang kailangan.
        $scope.loadAllUsers();
    } else if (currentPage.indexOf('AdminRequest') !== -1) {
        // Request Board: requests lang ang kailangan.
        $scope.loadAllRequests();
    } else if (currentPage.indexOf('ResidentDashboard') !== -1) {
        // Resident page: personal requests niya lang ang kailangan.
        $scope.loadMyRequests();
    }

});
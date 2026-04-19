using B_Serve.Models.Context;
using B_Serve.Models.Tables;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace B_Serve.Controllers
{
    public class BSRMSController : Controller
    {
        // ============================================================
        // PAGE ROUTES - These just return the HTML page views
        // ============================================================
        public ActionResult Index()       { return View(); }
        public ActionResult HomeDashboard()  { return View(); }
        public ActionResult Registration()   { return View(); }
        public ActionResult LogIn()          { return View(); }
        public ActionResult AdminApproval()  { return View(); }
        public ActionResult AdminRequest()   { return View(); }
        public ActionResult AdminUsers()     { return View(); }
        public ActionResult ResidentDashboard() { return View(); }

        // ============================================================
        // HELPER - returns a clean error message including nested ones
        // ============================================================
        private string GetFullError(Exception ex)
        {
            string msg = ex.Message;
            Exception inner = ex.InnerException;
            while (inner != null) { msg += " | " + inner.Message; inner = inner.InnerException; }
            return msg;
        }

        // ============================================================
        // INPUT CLASS - flat object from Angular for registration
        // ============================================================
        public class RegisterUserInput
        {
            public string firstName { get; set; }
            public string middleName { get; set; }
            public string lastName { get; set; }
            public string contactNumber { get; set; }
            public string blkLot { get; set; }
            public string street { get; set; }
            public string username { get; set; }
            public string password { get; set; }
            public string genderName { get; set; }
            public string purokName { get; set; }
        }

        // ============================================================
        // REGISTER - saves a new resident to the database
        // ============================================================
        [HttpPost]
        public JsonResult RegisterUser(RegisterUserInput input)
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    // Check if username is already taken
                    var existingUser = db.tbl_users.FirstOrDefault(u => u.username == input.username);
                    if (existingUser != null)
                    {
                        return Json(new { success = false, message = "Username \"" + input.username + "\" is already taken. Please choose a different one." });
                    }

                    // Find or create Gender
                    var gender = db.tbl_genders.FirstOrDefault(g => g.genderName == input.genderName);
                    if (gender == null) {
                        gender = new tbl_genders_model { genderName = input.genderName, createdAt = DateTime.Now, updatedAt = DateTime.Now };
                        db.tbl_genders.Add(gender);
                        db.SaveChanges();
                    }

                    // Find or create Purok
                    var purok = db.tbl_puroks.FirstOrDefault(p => p.purokName == input.purokName);
                    if (purok == null) {
                        purok = new tbl_puroks_model { purokName = input.purokName, createdAt = DateTime.Now, updatedAt = DateTime.Now };
                        db.tbl_puroks.Add(purok);
                        db.SaveChanges();
                    }

                    // Role is always Resident, Status is always Pending for new sign-ups
                    var role = db.tbl_roles.FirstOrDefault(r => r.roleName == "Resident");
                    var accStatus = db.tbl_account_statuses.FirstOrDefault(a => a.statusName == "Pending");

                    var newUser = new tbl_users_model
                    {
                        firstName = input.firstName,
                        middleName = input.middleName ?? "",
                        lastName = input.lastName,
                        contactNumber = input.contactNumber,
                        blkLot = input.blkLot,
                        street = input.street,
                        username = input.username,
                        password = input.password,
                        gendersID = gender.gendersID,
                        puroksID = purok.puroksID,
                        rolesID = role.rolesID,
                        account_statusesID = accStatus.account_statusesID,
                        createdAt = DateTime.Now,
                        updatedAt = DateTime.Now
                    };

                    db.tbl_users.Add(newUser);
                    db.SaveChanges();

                    return Json(new { success = true, message = "Registration Submitted! Please wait for admin verification." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + GetFullError(ex) });
            }
        }

        // ============================================================
        // LOGIN - checks username and password in the database
        // ============================================================
        [HttpPost]
        public JsonResult LoginUser(string username, string password)
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    var user = db.tbl_users.FirstOrDefault(u => u.username == username && u.password == password);
                    if (user == null)
                        return Json(new { success = false, message = "Wrong Username or Password" });

                    var role = db.tbl_roles.FirstOrDefault(r => r.rolesID == user.rolesID);
                    var status = db.tbl_account_statuses.FirstOrDefault(s => s.account_statusesID == user.account_statusesID);

                    return Json(new {
                        success = true,
                        usersID = user.usersID,
                        username = user.username,
                        role = role != null ? role.roleName : "Unknown",
                        status = status != null ? status.statusName : "Unknown"
                    });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + GetFullError(ex) });
            }
        }

        // ============================================================
        // GET ALL USERS - returns all residents from the database
        // Used by: AdminApproval, AdminUsers pages
        // ============================================================
        [HttpGet]
        public JsonResult GetAllUsers()
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    // Get all the lookup table data first
                    var roles = db.tbl_roles.ToList();
                    var statuses = db.tbl_account_statuses.ToList();
                    var genders = db.tbl_genders.ToList();
                    var puroks = db.tbl_puroks.ToList();

                    // Get all users, then map them to a simple object the Angular view can use
                    var users = db.tbl_users.ToList().Select(u => new {
                        usersID = u.usersID,
                        FirstName = u.firstName,
                        MiddleName = u.middleName,
                        LastName = u.lastName,
                        Contact = u.contactNumber,
                        BlkLot = u.blkLot,
                        Street = u.street,
                        Username = u.username,
                        Gender = genders.Where(g => g.gendersID == u.gendersID).Select(g => g.genderName).FirstOrDefault() ?? "",
                        Purok = puroks.Where(p => p.puroksID == u.puroksID).Select(p => p.purokName).FirstOrDefault() ?? "",
                        FullAddress = u.blkLot + " " + u.street + ", " + (puroks.Where(p => p.puroksID == u.puroksID).Select(p => p.purokName).FirstOrDefault() ?? ""),
                        Role = roles.Where(r => r.rolesID == u.rolesID).Select(r => r.roleName).FirstOrDefault() ?? "Unknown",
                        Status = statuses.Where(s => s.account_statusesID == u.account_statusesID).Select(s => s.statusName).FirstOrDefault() ?? "Unknown",
                        CreatedAt = u.createdAt.ToString("yyyy-MM")
                    }).ToList();

                    return Json(new { success = true, data = users }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + GetFullError(ex) }, JsonRequestBehavior.AllowGet);
            }
        }

        // ============================================================
        // APPROVE USER - changes resident status to Verified
        // ============================================================
        [HttpPost]
        public JsonResult ApproveUser(int usersID)
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    var user = db.tbl_users.FirstOrDefault(u => u.usersID == usersID);
                    if (user == null) return Json(new { success = false, message = "User not found." });

                    var verifiedStatus = db.tbl_account_statuses.FirstOrDefault(s => s.statusName == "Verified");
                    user.account_statusesID = verifiedStatus.account_statusesID;
                    user.updatedAt = DateTime.Now;
                    db.SaveChanges();

                    return Json(new { success = true, message = "Resident approved successfully." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + GetFullError(ex) });
            }
        }

        // ============================================================
        // REJECT USER - deletes the pending resident registration
        // ============================================================
        [HttpPost]
        public JsonResult RejectUser(int usersID)
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    var user = db.tbl_users.FirstOrDefault(u => u.usersID == usersID);
                    if (user == null) return Json(new { success = false, message = "User not found." });

                    db.tbl_users.Remove(user);
                    db.SaveChanges();

                    return Json(new { success = true, message = "Registration rejected and removed." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + GetFullError(ex) });
            }
        }

        // ============================================================
        // DELETE USER - removes a resident record from the database
        // ============================================================
        [HttpPost]
        public JsonResult DeleteUser(int usersID)
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    var user = db.tbl_users.FirstOrDefault(u => u.usersID == usersID);
                    if (user == null) return Json(new { success = false, message = "User not found." });

                    db.tbl_users.Remove(user);
                    db.SaveChanges();

                    return Json(new { success = true, message = "Resident record deleted." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + GetFullError(ex) });
            }
        }

        // ============================================================
        // GET ALL REQUESTS - returns all service requests
        // Used by: AdminRequest page
        // ============================================================
        [HttpGet]
        public JsonResult GetAllRequests()
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    var categories = db.tbl_request_categories.ToList();
                    var reqStatuses = db.tbl_request_statuses.ToList();
                    var users = db.tbl_users.ToList();
                    var details = db.tbl_request_details.ToList();

                    var requests = db.tbl_requests.ToList().Select(r => {
                        var resident = users.FirstOrDefault(u => u.usersID == r.resident_usersID);
                        var detail = details.FirstOrDefault(d => d.requestsID == r.requestsID);
                        return new {
                            requestsID = r.requestsID,
                            Sender = resident != null ? resident.username : "Unknown",
                            Type = categories.Where(c => c.request_categoriesID == r.request_categoriesID).Select(c => c.categoryName).FirstOrDefault() ?? "",
                            Status = reqStatuses.Where(s => s.request_statusesID == r.request_statusesID).Select(s => s.statusName).FirstOrDefault() ?? "Pending",
                            Message = detail != null ? detail.residentMessage : "",
                            AdminFeedback = detail != null ? detail.adminFeedback : "",
                            CreatedAt = r.createdAt.ToString("yyyy-MM")
                        };
                    }).ToList();

                    return Json(new { success = true, data = requests }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + GetFullError(ex) }, JsonRequestBehavior.AllowGet);
            }
        }

        // ============================================================
        // GET MY REQUESTS - returns requests for the logged-in resident
        // Used by: ResidentDashboard page
        // ============================================================
        [HttpGet]
        public JsonResult GetMyRequests(string username)
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    var resident = db.tbl_users.FirstOrDefault(u => u.username == username);
                    if (resident == null) return Json(new { success = false, message = "User not found." }, JsonRequestBehavior.AllowGet);

                    var categories = db.tbl_request_categories.ToList();
                    var reqStatuses = db.tbl_request_statuses.ToList();
                    var details = db.tbl_request_details.ToList();

                    var myRequests = db.tbl_requests
                        .Where(r => r.resident_usersID == resident.usersID)
                        .ToList()
                        .Select(r => {
                            var detail = details.FirstOrDefault(d => d.requestsID == r.requestsID);
                            return new {
                                requestsID = r.requestsID,
                                Type = categories.Where(c => c.request_categoriesID == r.request_categoriesID).Select(c => c.categoryName).FirstOrDefault() ?? "",
                                Status = reqStatuses.Where(s => s.request_statusesID == r.request_statusesID).Select(s => s.statusName).FirstOrDefault() ?? "Pending",
                                Message = detail != null ? detail.residentMessage : "",
                                AdminFeedback = detail != null ? detail.adminFeedback : ""
                            };
                        }).ToList();

                    return Json(new { success = true, data = myRequests }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + GetFullError(ex) }, JsonRequestBehavior.AllowGet);
            }
        }

        // ============================================================
        // SUBMIT REQUEST - resident submits a new service request
        // ============================================================
        public class SubmitRequestInput
        {
            public string username { get; set; }
            public string type { get; set; }
            public string message { get; set; }
        }

        [HttpPost]
        public JsonResult SubmitRequest(SubmitRequestInput input)
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    var resident = db.tbl_users.FirstOrDefault(u => u.username == input.username);
                    if (resident == null) return Json(new { success = false, message = "User not found." });

                    // Find category
                    var category = db.tbl_request_categories.FirstOrDefault(c => c.categoryName == input.type);
                    if (category == null) return Json(new { success = false, message = "Invalid category." });

                    // Status starts as Pending
                    var pendingStatus = db.tbl_request_statuses.FirstOrDefault(s => s.statusName == "Pending");

                    // Create the request record
                    var newRequest = new tbl_requests_model
                    {
                        resident_usersID = resident.usersID,
                        request_categoriesID = category.request_categoriesID,
                        request_statusesID = pendingStatus.request_statusesID,
                        createdAt = DateTime.Now,
                        updatedAt = DateTime.Now
                    };
                    db.tbl_requests.Add(newRequest);
                    db.SaveChanges();

                    // Save the message in request details
                    var newDetail = new tbl_request_details_model
                    {
                        requestsID = newRequest.requestsID,
                        residentMessage = input.message,
                        adminFeedback = "",
                        createdAt = DateTime.Now,
                        updatedAt = DateTime.Now
                    };
                    db.tbl_request_details.Add(newDetail);
                    db.SaveChanges();

                    return Json(new { success = true, message = "Request submitted successfully!" });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + GetFullError(ex) });
            }
        }

        // ============================================================
        // UPDATE REQUEST - admin updates a request status and feedback
        // ============================================================
        public class UpdateRequestInput
        {
            public int requestsID { get; set; }
            public string status { get; set; }
            public string adminFeedback { get; set; }
        }

        [HttpPost]
        public JsonResult UpdateRequest(UpdateRequestInput input)
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    var request = db.tbl_requests.FirstOrDefault(r => r.requestsID == input.requestsID);
                    if (request == null) return Json(new { success = false, message = "Request not found." });

                    // Update status
                    var newStatus = db.tbl_request_statuses.FirstOrDefault(s => s.statusName == input.status);
                    if (newStatus != null) request.request_statusesID = newStatus.request_statusesID;
                    request.updatedAt = DateTime.Now;

                    // Update admin feedback in details
                    var detail = db.tbl_request_details.FirstOrDefault(d => d.requestsID == input.requestsID);
                    if (detail != null) {
                        detail.adminFeedback = input.adminFeedback ?? "";
                        detail.updatedAt = DateTime.Now;
                    }

                    db.SaveChanges();
                    return Json(new { success = true, message = "Request updated successfully." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + GetFullError(ex) });
            }
        }

        // ============================================================
        // DELETE REQUEST - admin permanently removes a service request
        // ============================================================
        [HttpPost]
        public JsonResult DeleteRequest(int requestsID)
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    var request = db.tbl_requests.FirstOrDefault(r => r.requestsID == requestsID);
                    if (request == null) return Json(new { success = false, message = "Request not found." });

                    // Remove the detail row first (child record)
                    var detail = db.tbl_request_details.FirstOrDefault(d => d.requestsID == requestsID);
                    if (detail != null) db.tbl_request_details.Remove(detail);

                    // Then remove the request itself
                    db.tbl_requests.Remove(request);
                    db.SaveChanges();

                    return Json(new { success = true, message = "Request deleted successfully." });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + GetFullError(ex) });
            }
        }
    }
}
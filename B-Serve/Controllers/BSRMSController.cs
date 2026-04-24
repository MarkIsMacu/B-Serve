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
        // PAGE ROUTES - Dito natin kinukuha yung mga HTML pages para mag-load.
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
        // HELPER - Para makuha natin yung kumpletong error text kung sakaling may mag-fail.
        // ============================================================
        private string GetFullError(Exception ex)
        {
            string msg = ex.Message;
            Exception inner = ex.InnerException;
            while (inner != null) { msg += " | " + inner.Message; inner = inner.InnerException; }
            return msg;
        }

        // ============================================================
        // INPUT CLASS - Dito muna naka-store yung mga data galing sa register form.
        // ============================================================
        public class RegisterUserInput
        {
            public int usersID { get; set; }
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
        // REGISTER - Dito natin sinesave sa database yung bagong user na nag-signup.
        // ============================================================
        [HttpPost]
        public JsonResult RegisterUser(RegisterUserInput input)
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    // I-check muna natin kung may kaparehas na username sa database.
                    var existingUser = db.tbl_users.FirstOrDefault(u => u.username == input.username && u.usersID != input.usersID);
                    if (existingUser != null)
                    {
                        return Json(new { success = false, message = "Username \"" + input.username + "\" is already taken. Please choose a different one." });
                    }

                    // Hanapin o gumawa ng bagong gender sa table.
                    var gender = db.tbl_genders.FirstOrDefault(g => g.genderName == input.genderName);
                    if (gender == null) {
                        gender = new tbl_genders_model { genderName = input.genderName, createdAt = DateTime.Now, updatedAt = DateTime.Now };
                        db.tbl_genders.Add(gender);
                        db.SaveChanges();
                    }

                    // Hanapin o gumawa ng bagong purok sa table.
                    var purok = db.tbl_puroks.FirstOrDefault(p => p.purokName == input.purokName);
                    if (purok == null) {
                        purok = new tbl_puroks_model { purokName = input.purokName, createdAt = DateTime.Now, updatedAt = DateTime.Now };
                        db.tbl_puroks.Add(purok);
                        db.SaveChanges();
                    }

                    if (input.usersID > 0)
                    {
                        var userToUpdate = db.tbl_users.FirstOrDefault(u => u.usersID == input.usersID);
                        if (userToUpdate != null)
                        {
                            userToUpdate.firstName = input.firstName;
                            userToUpdate.middleName = input.middleName ?? "";
                            userToUpdate.lastName = input.lastName;
                            userToUpdate.contactNumber = input.contactNumber;
                            userToUpdate.blkLot = input.blkLot;
                            userToUpdate.street = input.street;
                            userToUpdate.username = input.username;
                            if (!string.IsNullOrEmpty(input.password)) {
                                userToUpdate.password = input.password;
                            }
                            userToUpdate.gendersID = gender.gendersID;
                            userToUpdate.puroksID = purok.puroksID;
                            userToUpdate.updatedAt = DateTime.Now;
                            
                            db.SaveChanges();
                            return Json(new { success = true, message = "Resident data updated successfully!" });
                        }
                    }

                    // Set natin as Resident at Pending yung status ng bagong account.
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
        // LOGIN - I-check natin kung tama yung username at password galing sa database.
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
        // GET ALL USERS - Kukunin natin lahat ng mga residents para makita sa Admin page.
        // ============================================================
        [HttpGet]
        public JsonResult GetAllUsers()
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    // Kunin muna natin yung listahan ng mga roles at status para hindi ID ang lumabas.
                    var roles = db.tbl_roles.ToList();
                    var statuses = db.tbl_account_statuses.ToList();
                    var genders = db.tbl_genders.ToList();
                    var puroks = db.tbl_puroks.ToList();

                    // Kunin lahat ng users tapos i-convert sa simpleng format na kailangan ng frontend.
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
        // APPROVE USER - Papalitan natin ng "Verified" yung status ng resident.
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
        // REJECT USER - Buburahin natin yung account ng user na na-reject.
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
        // DELETE USER - Tanggalin natin yung record ng resident sa database permanently.
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
        // UPDATE USER - I-a-update ni admin yung data ng existing resident.
        // ============================================================
        public class UpdateUserInput
        {
            public int usersID { get; set; }
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

        [HttpPost]
        public JsonResult UpdateUser(UpdateUserInput input)
        {
            try
            {
                using (var db = new BSRMSContext())
                {
                    // Hanapin yung user na ie-edit based sa kanyang ID.
                    var user = db.tbl_users.FirstOrDefault(u => u.usersID == input.usersID);
                    if (user == null)
                        return Json(new { success = false, message = "Resident not found." });

                    // I-check kung may ibang user na may ganitong username (hindi yung sarili niya).
                    var usernameConflict = db.tbl_users.FirstOrDefault(u => u.username == input.username && u.usersID != input.usersID);
                    if (usernameConflict != null)
                        return Json(new { success = false, message = "Username \"" + input.username + "\" is already taken by another resident." });

                    // Hanapin o gumawa ng gender record.
                    var gender = db.tbl_genders.FirstOrDefault(g => g.genderName == input.genderName);
                    if (gender == null)
                    {
                        gender = new tbl_genders_model { genderName = input.genderName, createdAt = DateTime.Now, updatedAt = DateTime.Now };
                        db.tbl_genders.Add(gender);
                        db.SaveChanges();
                    }

                    // Hanapin o gumawa ng purok record.
                    var purok = db.tbl_puroks.FirstOrDefault(p => p.purokName == input.purokName);
                    if (purok == null)
                    {
                        purok = new tbl_puroks_model { purokName = input.purokName, createdAt = DateTime.Now, updatedAt = DateTime.Now };
                        db.tbl_puroks.Add(purok);
                        db.SaveChanges();
                    }

                    // I-update ang lahat ng fields ng resident.
                    user.firstName = input.firstName;
                    user.middleName = input.middleName ?? "";
                    user.lastName = input.lastName;
                    user.contactNumber = input.contactNumber;
                    user.blkLot = input.blkLot;
                    user.street = input.street;
                    user.username = input.username;
                    user.gendersID = gender.gendersID;
                    user.puroksID = purok.puroksID;
                    user.updatedAt = DateTime.Now;

                    // I-update lang yung password kung may bagong binigay.
                    if (!string.IsNullOrEmpty(input.password))
                        user.password = input.password;

                    db.SaveChanges();
                    return Json(new { success = true, message = "Resident data updated successfully!" });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error: " + GetFullError(ex) });
            }
        }

        // ============================================================
        // GET ALL REQUESTS - Kukunin natin lahat ng service requests para sa Admin page.
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
        // GET MY REQUESTS - Kukunin lang natin yung mga requests nung naka-login na user.
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
        // SUBMIT REQUEST - Dito isesave sa database yung bagong request ni resident.
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

                    // Hanapin natin yung napiling request category.
                    var category = db.tbl_request_categories.FirstOrDefault(c => c.categoryName == input.type);
                    if (category == null) return Json(new { success = false, message = "Invalid category." });

                    // Default na "Pending" yung status pagkatuloy ma-submit.
                    var pendingStatus = db.tbl_request_statuses.FirstOrDefault(s => s.statusName == "Pending");

                    // Gagawa tayo ng record para sa request table.
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

                    // Isesave din natin yung message sa detail table.
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
        // UPDATE REQUEST - I-a-update ni admin yung status at message ng request.
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

                    // Palitan natin yung old status ng bagong status galing sa admin.
                    var newStatus = db.tbl_request_statuses.FirstOrDefault(s => s.statusName == input.status);
                    if (newStatus != null) request.request_statusesID = newStatus.request_statusesID;
                    request.updatedAt = DateTime.Now;

                    // Isave din natin yung reply ni admin sa details table.
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
        // DELETE REQUEST - Ide-delete permanently ni admin yung service request.
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

                    // Buburahin muna natin yung details bago yung mismong request para hindi mag-error.
                    var detail = db.tbl_request_details.FirstOrDefault(d => d.requestsID == requestsID);
                    if (detail != null) db.tbl_request_details.Remove(detail);

                    // Tapos pwede na natin burahin yung request record.
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
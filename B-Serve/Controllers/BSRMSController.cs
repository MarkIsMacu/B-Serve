using B_Serve.Models.Context;
using B_Serve.Models.Tables;
using Microsoft.Ajax.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace B_Serve.Controllers
{
    public class BSRMSController : Controller
    {
        // GET: BSRMS
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult HomeDashboard()
        {
            return View();
        }

        public ActionResult Registration()
        {
            return View();
        }

        public ActionResult LogIn()
        {
            return View();
        }

        public ActionResult AdminApproval()
        {
            return View();
        }
        public ActionResult AdminRequest()
        {
            return View();
        }

        public ActionResult AdminUsers()
        {
            return View();
        }

        public ActionResult ResidentDashboard()
        {
            return View();
        }

        public string UpsertAccount_Status()
        {
            try 
            {
                using (var connect = new BSRMSContext())
                {
                    var account_status = new tbl_request_statuses_model()
                    {
                        statusName = "On - going",
                        createdAt = DateTime.Now,
                        updatedAt = DateTime.Now
                    };
                    connect.tbl_request_statuses.Add(account_status);
                    connect.SaveChanges();

                    return "Success";

                }
            }
            catch(Exception ex)
            {
                return ErrorHandling(ex.Message, ex.StackTrace, ex.InnerException.ToString());
            }
            return "Success";
        }

        private string ErrorHandling(string message, string stackTrace, string v)
        {
            throw new NotImplementedException();
        }
    }
}
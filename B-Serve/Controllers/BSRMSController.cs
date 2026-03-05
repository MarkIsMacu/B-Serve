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
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Tables
{
    public class tbl_request_details_model
    {
        public int request_detailsID { get; set; }
        public int requestsID { get; set; }
        public string residentMessage { get; set; }
        public string adminFeedback { get; set; }
        public DateTime createdAt { get; set; }
        public DateTime updatedAt { get; set; }
    }
}
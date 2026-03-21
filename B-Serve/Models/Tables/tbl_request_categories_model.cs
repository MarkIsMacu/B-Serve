using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Tables
{
    public class tbl_request_categories_model
    {
        public int request_categoriesID { get; set; }
        public string categoryName { get; set; }
        public DateTime createdAt { get; set; }
        public DateTime updatedAt { get; set; }


    }
}
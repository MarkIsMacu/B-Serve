using B_Serve.Models.Tables;
using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Maps
{
    public class tbl_request_categories_map : EntityTypeConfiguration<tbl_request_categories_model>
    {
        public tbl_request_categories_map()
        {
            HasKey(i => i.request_categoriesID);
            ToTable("tbl_request_categories");
        }
    }
}
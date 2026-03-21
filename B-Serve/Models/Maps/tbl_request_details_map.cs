using B_Serve.Models.Tables;
using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Maps
{
    public class tbl_request_details_map : EntityTypeConfiguration<tbl_request_details_model>
    {
        public tbl_request_details_map()
        {
            HasKey(i => i.request_detailsID);
            ToTable("tbl_request_details");
        }
    }
}
using B_Serve.Models.Tables;
using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Maps
{
    public class tbl_requests_map : EntityTypeConfiguration<tbl_requests_model>
    {
        public tbl_requests_map()
        {
            HasKey(i => i.requestsID);
            ToTable("tbl_requests");
        }
    }
}
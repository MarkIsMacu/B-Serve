using B_Serve.Models.Tables;
using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Maps
{
    public class tbl_puroks_map : EntityTypeConfiguration<tbl_puroks_model>
    {
        public tbl_puroks_map()
        {
            HasKey(i => i.puroksID);
            ToTable("tbl_puroks");
        }
    }
}
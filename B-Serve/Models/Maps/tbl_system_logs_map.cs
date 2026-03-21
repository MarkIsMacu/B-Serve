using B_Serve.Models.Tables;
using System;
using System.Collections.Generic;
using System.Data.Entity.ModelConfiguration;
using System.Linq;
using System.Web;

namespace B_Serve.Models.Maps
{
    public class tbl_system_logs_map : EntityTypeConfiguration<tbl_system_logs_model>
    {
        public tbl_system_logs_map()
        {
            HasKey(i => i.system_logsID);
            ToTable("tbl_system_logs");
        }
    }
}
# File And Attachment Matrix

Every legacy file reference must be migrated to modern object storage or explicitly marked missing.

| Source Dump | Legacy Table | File Columns | Modern Destination | Status |
| --- | --- | --- | --- | --- |
| kiddzonl_garderie17-18 | login_profiles | profile_label, profile_value |  | needs storage migration rule |
| kiddzonl_garderie17-18 | t_absent_attachments | url | AbsenceAttachment | needs storage migration rule |
| kiddzonl_garderie17-18 | t_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie17-18 | t_branch | image | Branch | needs storage migration rule |
| kiddzonl_garderie17-18 | t_child | image | Child | needs storage migration rule |
| kiddzonl_garderie17-18 | t_child_draft | image | Child | needs storage migration rule |
| kiddzonl_garderie17-18 | t_child_h | image | ChildHistory | needs storage migration rule |
| kiddzonl_garderie17-18 | t_class | image | Class | needs storage migration rule |
| kiddzonl_garderie17-18 | t_daily_attachments | url | DailyReportAttachment | needs storage migration rule |
| kiddzonl_garderie17-18 | t_forms_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie17-18 | t_garderie_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie17-18 | t_garderie_doctor | image |  | needs storage migration rule |
| kiddzonl_garderie17-18 | t_garderie_doctor_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie17-18 | t_manager | image | Manager | needs storage migration rule |
| kiddzonl_garderie17-18 | t_manager_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie17-18 | t_nurse | image | Nurse | needs storage migration rule |
| kiddzonl_garderie17-18 | t_nurse_attachments | url | NurseAttachment | needs storage migration rule |
| kiddzonl_garderie17-18 | t_payments | image | Payment | needs storage migration rule |
| kiddzonl_garderie17-18 | t_teacher | image | Teacher | needs storage migration rule |
| kiddzonl_garderie17-18 | t_teacher_attachments | url | TeacherAttachment | needs storage migration rule |
| kiddzonl_garderie29sept | login_profiles | profile_label, profile_value |  | needs storage migration rule |
| kiddzonl_garderie29sept | t_absent_attachments | url | AbsenceAttachment | needs storage migration rule |
| kiddzonl_garderie29sept | t_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie29sept | t_branch | image | Branch | needs storage migration rule |
| kiddzonl_garderie29sept | t_child | image | Child | needs storage migration rule |
| kiddzonl_garderie29sept | t_child_draft | image | Child | needs storage migration rule |
| kiddzonl_garderie29sept | t_child_h | image | ChildHistory | needs storage migration rule |
| kiddzonl_garderie29sept | t_class | image | Class | needs storage migration rule |
| kiddzonl_garderie29sept | t_daily_attachments | url | DailyReportAttachment | needs storage migration rule |
| kiddzonl_garderie29sept | t_forms_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie29sept | t_garderie_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie29sept | t_garderie_doctor | image |  | needs storage migration rule |
| kiddzonl_garderie29sept | t_garderie_doctor_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie29sept | t_manager | image | Manager | needs storage migration rule |
| kiddzonl_garderie29sept | t_manager_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie29sept | t_nurse | image | Nurse | needs storage migration rule |
| kiddzonl_garderie29sept | t_nurse_attachments | url | NurseAttachment | needs storage migration rule |
| kiddzonl_garderie29sept | t_payments | image | Payment | needs storage migration rule |
| kiddzonl_garderie29sept | t_teacher | image | Teacher | needs storage migration rule |
| kiddzonl_garderie29sept | t_teacher_attachments | url | TeacherAttachment | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | login_profiles | profile_label, profile_value |  | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_absent_attachments | url | AbsenceAttachment | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_branch | image | Branch | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_child | image | Child | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_child_draft | image | Child | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_child_h | image | ChildHistory | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_class | image | Class | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_daily_attachments | url | DailyReportAttachment | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_forms_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_garderie_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_garderie_doctor | image |  | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_garderie_doctor_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_manager | image | Manager | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_manager_attachments | url |  | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_nurse | image | Nurse | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_nurse_attachments | url | NurseAttachment | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_payments | image | Payment | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_teacher | image | Teacher | needs storage migration rule |
| kiddzonl_garderie_2018-2019 | t_teacher_attachments | url | TeacherAttachment | needs storage migration rule |
| kiddzonl_master29sept | login_profiles | profile_value |  | needs storage migration rule |
| kiddzonl_users29sept | login_profiles | profile_value |  | needs storage migration rule |
| kiddzonl_users29sept | login_profiles_man | profile_value |  | needs storage migration rule |
| kiddzonl_users29sept | t_branch | image | Branch | needs storage migration rule |
| kiddzonl_users29sept | t_class | image | Class | needs storage migration rule |
| kiddzonl_users_2018-2019 | login_profiles | profile_value |  | needs storage migration rule |
| kiddzonl_users_2018-2019 | login_profiles_man | profile_value |  | needs storage migration rule |
| kiddzonl_users_2018-2019 | t_branch | image | Branch | needs storage migration rule |
| kiddzonl_users_2018-2019 | t_class | image | Class | needs storage migration rule |

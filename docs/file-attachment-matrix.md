# File And Attachment Matrix

Every legacy file reference must be migrated to modern object storage or explicitly marked missing.

| Source Dump | Legacy Table | File Columns | Modern Destination | Status |
| --- | --- | --- | --- | --- |
| kiddzonl_garderie17-18 | login_profiles | profile_label, profile_value |  | covered by migrate-auth-metadata.ts |
| kiddzonl_garderie17-18 | t_absent_attachments | url | AbsenceAttachment | source path identified; filename preserved by migrate-absences.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_attachments | url | ChildAttachment | source path identified; data rows covered by migrate-garderie-misc.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_branch | image | Branch | source path identified; filename preserved by migrate-branches.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_child | image | Child | source path identified; filename preserved by migrate-children.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_child_draft | image | Child | source path identified; filename preserved by migrate-children.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_child_h | image | ChildHistory | source path identified; filename preserved by migrate-children.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_class | image | Class | source path identified; filename preserved by migrate-classes.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_daily_attachments | url | DailyReportAttachment | source path identified; filename preserved by migrate-daily-reports.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_forms_attachments | url | FormAttachment | source path identified; filename preserved by migrate-medical.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_garderie_attachments | url | BranchDocument | source path identified; data rows covered by migrate-garderie-profile.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_garderie_doctor | image | Doctor | source path identified; data rows covered by migrate-garderie-misc.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_garderie_doctor_attachments | url | DoctorAttachment | source path identified; data rows covered by migrate-garderie-misc.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_manager | image | Manager | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_manager_attachments | url | ManagerAttachment | source path identified; data rows covered by migrate-garderie-misc.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_nurse | image | Nurse | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_nurse_attachments | url | NurseAttachment | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_payments | image | Payment | source path identified; receipt filename preserved by migrate-payments.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_teacher | image | Teacher | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie17-18 | t_teacher_attachments | url | TeacherAttachment | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie29sept | login_profiles | profile_label, profile_value |  | covered by migrate-auth-metadata.ts |
| kiddzonl_garderie29sept | t_absent_attachments | url | AbsenceAttachment | source path identified; filename preserved by migrate-absences.ts; needs object storage import |
| kiddzonl_garderie29sept | t_attachments | url | ChildAttachment | source path identified; data rows covered by migrate-garderie-misc.ts; needs object storage import |
| kiddzonl_garderie29sept | t_branch | image | Branch | source path identified; filename preserved by migrate-branches.ts; needs object storage import |
| kiddzonl_garderie29sept | t_child | image | Child | source path identified; filename preserved by migrate-children.ts; needs object storage import |
| kiddzonl_garderie29sept | t_child_draft | image | Child | source path identified; filename preserved by migrate-children.ts; needs object storage import |
| kiddzonl_garderie29sept | t_child_h | image | ChildHistory | source path identified; filename preserved by migrate-children.ts; needs object storage import |
| kiddzonl_garderie29sept | t_class | image | Class | source path identified; filename preserved by migrate-classes.ts; needs object storage import |
| kiddzonl_garderie29sept | t_daily_attachments | url | DailyReportAttachment | source path identified; filename preserved by migrate-daily-reports.ts; needs object storage import |
| kiddzonl_garderie29sept | t_forms_attachments | url | FormAttachment | source path identified; filename preserved by migrate-medical.ts; needs object storage import |
| kiddzonl_garderie29sept | t_garderie_attachments | url | BranchDocument | source path identified; data rows covered by migrate-garderie-profile.ts; needs object storage import |
| kiddzonl_garderie29sept | t_garderie_doctor | image | Doctor | source path identified; data rows covered by migrate-garderie-misc.ts; needs object storage import |
| kiddzonl_garderie29sept | t_garderie_doctor_attachments | url | DoctorAttachment | source path identified; data rows covered by migrate-garderie-misc.ts; needs object storage import |
| kiddzonl_garderie29sept | t_manager | image | Manager | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie29sept | t_manager_attachments | url | ManagerAttachment | source path identified; data rows covered by migrate-garderie-misc.ts; needs object storage import |
| kiddzonl_garderie29sept | t_nurse | image | Nurse | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie29sept | t_nurse_attachments | url | NurseAttachment | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie29sept | t_payments | image | Payment | source path identified; receipt filename preserved by migrate-payments.ts; needs object storage import |
| kiddzonl_garderie29sept | t_teacher | image | Teacher | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie29sept | t_teacher_attachments | url | TeacherAttachment | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | login_profiles | profile_label, profile_value |  | covered by migrate-auth-metadata.ts |
| kiddzonl_garderie_2018-2019 | t_absent_attachments | url | AbsenceAttachment | source path identified; filename preserved by migrate-absences.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_attachments | url | ChildAttachment | source path identified; data rows covered by migrate-garderie-misc.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_branch | image | Branch | source path identified; filename preserved by migrate-branches.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_child | image | Child | source path identified; filename preserved by migrate-children.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_child_draft | image | Child | source path identified; filename preserved by migrate-children.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_child_h | image | ChildHistory | source path identified; filename preserved by migrate-children.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_class | image | Class | source path identified; filename preserved by migrate-classes.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_daily_attachments | url | DailyReportAttachment | source path identified; filename preserved by migrate-daily-reports.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_forms_attachments | url | FormAttachment | source path identified; filename preserved by migrate-medical.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_garderie_attachments | url | BranchDocument | source path identified; data rows covered by migrate-garderie-profile.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_garderie_doctor | image | Doctor | source path identified; data rows covered by migrate-garderie-misc.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_garderie_doctor_attachments | url | DoctorAttachment | source path identified; data rows covered by migrate-garderie-misc.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_manager | image | Manager | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_manager_attachments | url | ManagerAttachment | source path identified; data rows covered by migrate-garderie-misc.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_nurse | image | Nurse | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_nurse_attachments | url | NurseAttachment | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_payments | image | Payment | source path identified; receipt filename preserved by migrate-payments.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_teacher | image | Teacher | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_garderie_2018-2019 | t_teacher_attachments | url | TeacherAttachment | source path identified; filename preserved by migrate-employees.ts; needs object storage import |
| kiddzonl_master29sept | login_profiles | profile_value | LegacyAuthRecord | covered by migrate-auth-metadata.ts |
| kiddzonl_users29sept | login_profiles | profile_value | LegacyAuthRecord | covered by migrate-auth-metadata.ts |
| kiddzonl_users29sept | login_profiles_man | profile_value | LegacyAuthRecord | covered by migrate-auth-metadata.ts |
| kiddzonl_users29sept | t_branch | image | Branch | source path identified; filename preserved by migrate-branches.ts; needs object storage import |
| kiddzonl_users29sept | t_class | image | Class | source path identified; filename preserved by migrate-classes.ts; needs object storage import |
| kiddzonl_users_2018-2019 | login_profiles | profile_value | LegacyAuthRecord | covered by migrate-auth-metadata.ts |
| kiddzonl_users_2018-2019 | login_profiles_man | profile_value | LegacyAuthRecord | covered by migrate-auth-metadata.ts |
| kiddzonl_users_2018-2019 | t_branch | image | Branch | source path identified; filename preserved by migrate-branches.ts; needs object storage import |
| kiddzonl_users_2018-2019 | t_class | image | Class | source path identified; filename preserved by migrate-classes.ts; needs object storage import |

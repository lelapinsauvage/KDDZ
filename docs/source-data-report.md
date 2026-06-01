# Legacy Source Data Report

Generated from the local SQL dumps in `Garderie-old-backup/ajax/annual backups`.

This is a static SQL-dump estimate. It counts rows from `INSERT INTO ... VALUES` statements and should be confirmed by importing dumps into MySQL and running live `COUNT(*)` queries.

## Dump Summary

| SQL Dump | Tables | Estimated Insert Rows |
| --- | --- | --- |
| kiddzonl_garderie17-18.sql | 104 | 0 |
| kiddzonl_garderie29sept.sql | 122 | 20018 |
| kiddzonl_garderie_2018-2019.sql | 104 | 0 |
| kiddzonl_master29sept.sql | 13 | 198 |
| kiddzonl_users29sept.sql | 26 | 6877 |
| kiddzonl_users_2018-2019.sql | 26 | 0 |

## Non-Empty Tables Without Confirmed Migration Coverage

These are the highest-risk migration gaps because source data exists and no current migration script is known to cover them.

| SQL Dump | Legacy Table | Estimated Rows | Columns |
| --- | --- | --- | --- |
| kiddzonl_garderie29sept.sql | notifications_nature | 11 | id, n_name, descr, table1, table2, table3, table1_column, table3_column, child_column, subject_col, body_col, n_order, active |
| kiddzonl_garderie29sept.sql | t_old_garderie | 8 | gid, gname, gyear, child_id, active, datetime |
| kiddzonl_garderie29sept.sql | t_garderie_attachments | 7 | fattid, branch_id, att_title, exp_date, start_date, url, type, datetime, active |
| kiddzonl_garderie29sept.sql | login_confirm | 5 | id, data, username, email, key, type |
| kiddzonl_garderie29sept.sql | login_profiles | 2 | p_id, pfield_id, user_id, profile_label, profile_value |
| kiddzonl_garderie29sept.sql | parent_login_levels | 2 | id, level_name, level_disabled, redirect, welcome_email |
| kiddzonl_garderie29sept.sql | t_garderie | 2 | id, branch_id, formtype, special_for, special_num, special_date, name, father, family, mother, idnum, nationality, pob, dob, type, legal_name, companytype, type_others, sub_others, subject, regnum, regplace, regdate, res_name, res_position, res_nationality, res_phone, garderie_ar, garderie, gar_country, gar_muhafaza, gar_quadaa, gar_region, gar_street, gar_bldg, gar_floor, gar_post, gar_post_no, gar_tel, gar_phone, gar_fax, gar_email, gar_website, app_owner_name, app_num, app_regoin, app_muhafaza, app_quadaa, ownership, rent_name, rent_date, rentalverify, man_name, man_family, man_pos, doc_name, doc_father, doc_family, doc_pos, doc_reg_no, child_walk, child_n_walk, work_hours, daman, damantype, progress, uby, datetime, latitude, longitude |
| kiddzonl_garderie29sept.sql | t_school_year | 2 | id, sid, sdate |
| kiddzonl_garderie29sept.sql | login_profile_fields | 1 | id, section, type, label, public, signup |
| kiddzonl_garderie29sept.sql | t_attachments | 1 | attid, att_title, url, child_id, datetime, active |
| kiddzonl_garderie29sept.sql | t_events_types | 1 | id, event_name, default_subject, default_message |
| kiddzonl_garderie29sept.sql | t_garderie_doctor | 1 | teacher_id, image, reg_num, f_name, m_name, l_name, f_name_ar, m_name_ar, l_name_ar, dob, pob, nationality, sel_gender, mobile, email, uni_degree, uni_degree_ar, sel_branch, active, deleted, datetime, uby |
| kiddzonl_garderie29sept.sql | t_garderie_doctor_attachments | 1 | tattid, att_title, url, teacher_id, type, exp_date, datetime, active |
| kiddzonl_garderie29sept.sql | t_manager_attachments | 1 | tattid, att_title, url, teacher_id, type, exp_date, datetime, active |
| kiddzonl_master29sept.sql | actions_control | 43 | actioncon_level_id, actioncon_sysact_id |
| kiddzonl_master29sept.sql | system_actions | 24 | sysaction_id, sysaction_group_id, sysaction_name, sysaction_type, sysaction_descr, sysaction_is_active |
| kiddzonl_master29sept.sql | users_control | 18 | usercon_user_id, usercon_sysact_id |
| kiddzonl_master29sept.sql | t_garderies | 8 | gid, garderie_name, garderie_alias, user_manage_db, current_db, path, active |
| kiddzonl_master29sept.sql | login_confirm | 2 | id, data, username, email, key, type |
| kiddzonl_master29sept.sql | notifications | 2 | id, email, whatsapp, sms, gid |
| kiddzonl_master29sept.sql | login_levels | 1 | id, level_name, level_disabled, redirect, welcome_email |
| kiddzonl_users29sept.sql | actions_control | 104 | actioncon_level_id, actioncon_sysact_id |
| kiddzonl_users29sept.sql | system_actions | 64 | sysaction_id, sysaction_group_id, sysaction_name, sysaction_type, sysaction_descr, sysaction_is_active |
| kiddzonl_users29sept.sql | actions_control_man | 43 | actioncon_level_id, actioncon_sysact_id |
| kiddzonl_users29sept.sql | system_actions_man | 24 | sysaction_id, sysaction_group_id, sysaction_name, sysaction_type, sysaction_descr, sysaction_is_active |
| kiddzonl_users29sept.sql | users_control | 18 | usercon_user_id, usercon_sysact_id |
| kiddzonl_users29sept.sql | year_select | 10 | yid, sel_year |
| kiddzonl_users29sept.sql | login_levels | 7 | id, level_name, level_disabled, redirect, welcome_email |
| kiddzonl_users29sept.sql | login_confirm | 4 | id, data, username, email, key, type |
| kiddzonl_users29sept.sql | login_confirm_man | 2 | id, data, username, email, key, type |
| kiddzonl_users29sept.sql | login_levels_man | 2 | id, level_name, level_disabled, redirect, welcome_email |
| kiddzonl_users29sept.sql | year_db | 2 | dbid, db_yid, dbname, selected, datetime |
| kiddzonl_users29sept.sql | login_users_man | 1 | user_id, user_level, restricted, username, name, email, password, db_id, timestamp, usites, uclasses, uchild |

## File Reference Tables

These tables have file/image/url/attachment columns and need explicit object-storage migration rules.

| SQL Dump | Legacy Table | Estimated Rows | File Columns | Coverage |
| --- | --- | --- | --- | --- |
| kiddzonl_garderie17-18.sql | login_profiles | 0 | profile_label, profile_value | needs file migration rule |
| kiddzonl_garderie17-18.sql | t_absent_attachments | 0 | url | covered by migrate-absences.ts |
| kiddzonl_garderie17-18.sql | t_attachments | 0 | url | needs file migration rule |
| kiddzonl_garderie17-18.sql | t_branch | 0 | image | covered by migrate-branches.ts |
| kiddzonl_garderie17-18.sql | t_child | 0 | image | covered by migrate-children.ts |
| kiddzonl_garderie17-18.sql | t_child_draft | 0 | image | covered by migrate-children.ts |
| kiddzonl_garderie17-18.sql | t_child_h | 0 | image | covered by migrate-children.ts |
| kiddzonl_garderie17-18.sql | t_class | 0 | image | covered by migrate-classes.ts |
| kiddzonl_garderie17-18.sql | t_daily_attachments | 0 | url | covered by migrate-daily-reports.ts |
| kiddzonl_garderie17-18.sql | t_forms_attachments | 0 | url | covered by migrate-medical.ts |
| kiddzonl_garderie17-18.sql | t_garderie_attachments | 0 | url | needs file migration rule |
| kiddzonl_garderie17-18.sql | t_garderie_doctor | 0 | image | needs file migration rule |
| kiddzonl_garderie17-18.sql | t_garderie_doctor_attachments | 0 | url | needs file migration rule |
| kiddzonl_garderie17-18.sql | t_manager | 0 | image | covered by migrate-employees.ts |
| kiddzonl_garderie17-18.sql | t_manager_attachments | 0 | url | needs file migration rule |
| kiddzonl_garderie17-18.sql | t_nurse | 0 | image | covered by migrate-employees.ts |
| kiddzonl_garderie17-18.sql | t_nurse_attachments | 0 | url | covered by migrate-employees.ts |
| kiddzonl_garderie17-18.sql | t_payments | 0 | image | covered by migrate-payments.ts |
| kiddzonl_garderie17-18.sql | t_teacher | 0 | image | covered by migrate-employees.ts |
| kiddzonl_garderie17-18.sql | t_teacher_attachments | 0 | url | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | t_payments | 435 | image | covered by migrate-payments.ts |
| kiddzonl_garderie29sept.sql | t_child_h | 114 | image | covered by migrate-children.ts |
| kiddzonl_garderie29sept.sql | t_child | 79 | image | covered by migrate-children.ts |
| kiddzonl_garderie29sept.sql | t_forms_attachments | 72 | url | covered by migrate-medical.ts |
| kiddzonl_garderie29sept.sql | t_teacher | 11 | image | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | t_teacher_attachments | 10 | url | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | t_class | 9 | image | covered by migrate-classes.ts |
| kiddzonl_garderie29sept.sql | t_branch | 7 | image | covered by migrate-branches.ts |
| kiddzonl_garderie29sept.sql | t_garderie_attachments | 7 | url | needs file migration rule |
| kiddzonl_garderie29sept.sql | t_nurse | 3 | image | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | login_profiles | 2 | profile_label, profile_value | needs file migration rule |
| kiddzonl_garderie29sept.sql | t_attachments | 1 | url | needs file migration rule |
| kiddzonl_garderie29sept.sql | t_garderie_doctor | 1 | image | needs file migration rule |
| kiddzonl_garderie29sept.sql | t_garderie_doctor_attachments | 1 | url | needs file migration rule |
| kiddzonl_garderie29sept.sql | t_manager | 1 | image | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | t_manager_attachments | 1 | url | needs file migration rule |
| kiddzonl_garderie29sept.sql | t_nurse_attachments | 1 | url | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | t_absent_attachments | 0 | url | covered by migrate-absences.ts |
| kiddzonl_garderie29sept.sql | t_child_draft | 0 | image | covered by migrate-children.ts |
| kiddzonl_garderie29sept.sql | t_daily_attachments | 0 | url | covered by migrate-daily-reports.ts |
| kiddzonl_garderie_2018-2019.sql | login_profiles | 0 | profile_label, profile_value | needs file migration rule |
| kiddzonl_garderie_2018-2019.sql | t_absent_attachments | 0 | url | covered by migrate-absences.ts |
| kiddzonl_garderie_2018-2019.sql | t_attachments | 0 | url | needs file migration rule |
| kiddzonl_garderie_2018-2019.sql | t_branch | 0 | image | covered by migrate-branches.ts |
| kiddzonl_garderie_2018-2019.sql | t_child | 0 | image | covered by migrate-children.ts |
| kiddzonl_garderie_2018-2019.sql | t_child_draft | 0 | image | covered by migrate-children.ts |
| kiddzonl_garderie_2018-2019.sql | t_child_h | 0 | image | covered by migrate-children.ts |
| kiddzonl_garderie_2018-2019.sql | t_class | 0 | image | covered by migrate-classes.ts |
| kiddzonl_garderie_2018-2019.sql | t_daily_attachments | 0 | url | covered by migrate-daily-reports.ts |
| kiddzonl_garderie_2018-2019.sql | t_forms_attachments | 0 | url | covered by migrate-medical.ts |
| kiddzonl_garderie_2018-2019.sql | t_garderie_attachments | 0 | url | needs file migration rule |
| kiddzonl_garderie_2018-2019.sql | t_garderie_doctor | 0 | image | needs file migration rule |
| kiddzonl_garderie_2018-2019.sql | t_garderie_doctor_attachments | 0 | url | needs file migration rule |
| kiddzonl_garderie_2018-2019.sql | t_manager | 0 | image | covered by migrate-employees.ts |
| kiddzonl_garderie_2018-2019.sql | t_manager_attachments | 0 | url | needs file migration rule |
| kiddzonl_garderie_2018-2019.sql | t_nurse | 0 | image | covered by migrate-employees.ts |
| kiddzonl_garderie_2018-2019.sql | t_nurse_attachments | 0 | url | covered by migrate-employees.ts |
| kiddzonl_garderie_2018-2019.sql | t_payments | 0 | image | covered by migrate-payments.ts |
| kiddzonl_garderie_2018-2019.sql | t_teacher | 0 | image | covered by migrate-employees.ts |
| kiddzonl_garderie_2018-2019.sql | t_teacher_attachments | 0 | url | covered by migrate-employees.ts |
| kiddzonl_master29sept.sql | login_profiles | 0 | profile_value | needs file migration rule |
| kiddzonl_users29sept.sql | t_class | 9 | image | covered by migrate-classes.ts |
| kiddzonl_users29sept.sql | t_branch | 7 | image | covered by migrate-branches.ts |
| kiddzonl_users29sept.sql | login_profiles | 0 | profile_value | needs file migration rule |
| kiddzonl_users29sept.sql | login_profiles_man | 0 | profile_value | needs file migration rule |
| kiddzonl_users_2018-2019.sql | login_profiles | 0 | profile_value | needs file migration rule |
| kiddzonl_users_2018-2019.sql | login_profiles_man | 0 | profile_value | needs file migration rule |
| kiddzonl_users_2018-2019.sql | t_branch | 0 | image | covered by migrate-branches.ts |
| kiddzonl_users_2018-2019.sql | t_class | 0 | image | covered by migrate-classes.ts |

## Full Table Coverage

| SQL Dump | Legacy Table | Column Count | Estimated Rows | Known Coverage |
| --- | --- | --- | --- | --- |
| kiddzonl_garderie17-18.sql | callcauses | 3 | 0 | covered by migrate-calls.ts |
| kiddzonl_garderie17-18.sql | callparent | 2 | 0 | covered by migrate-calls.ts |
| kiddzonl_garderie17-18.sql | custom_notifications | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | custom_notifications_assessment | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | custom_notifications_birthday | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | custom_notifications_contracts | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | custom_notifications_events | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | custom_notifications_holiday | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | custom_notifications_insurance | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | custom_notifications_medical | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | custom_notifications_medicine | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | custom_notifications_msg | 4 | 0 | covered by migrate-messages.ts |
| kiddzonl_garderie17-18.sql | custom_notifications_payments | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | custom_notifications_vaccinations | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | login_confirm | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | login_integration | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | login_profile_fields | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | login_profiles | 5 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | login_settings | 3 | 0 | covered by migrate-settings.ts |
| kiddzonl_garderie17-18.sql | login_timestamps | 4 | 0 | covered by migrate-login-audit.ts |
| kiddzonl_garderie17-18.sql | login_users | 12 | 0 | covered by migrate-users.ts |
| kiddzonl_garderie17-18.sql | new_assessment | 6 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie17-18.sql | newpayment | 10 | 0 | covered by migrate-payments.ts |
| kiddzonl_garderie17-18.sql | parent_login_levels | 5 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | parent_login_settings | 3 | 0 | covered by migrate-settings.ts |
| kiddzonl_garderie17-18.sql | parent_login_timestamps | 4 | 0 | covered by migrate-login-audit.ts |
| kiddzonl_garderie17-18.sql | parent_login_users | 9 | 0 | covered by migrate-parents.ts |
| kiddzonl_garderie17-18.sql | t_absent_attachments | 6 | 0 | covered by migrate-absences.ts |
| kiddzonl_garderie17-18.sql | t_absent_report | 17 | 0 | covered by migrate-absences.ts |
| kiddzonl_garderie17-18.sql | t_accounting | 29 | 0 | covered by migrate-payments.ts |
| kiddzonl_garderie17-18.sql | t_address | 19 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie17-18.sql | t_alarms | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | t_alarms_assessment | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | t_alarms_birthday | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | t_alarms_contracts | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | t_alarms_insurance | 10 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | t_alarms_medical | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | t_alarms_medicine | 10 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | t_alarms_msg | 11 | 0 | covered by migrate-messages.ts |
| kiddzonl_garderie17-18.sql | t_alarms_payments | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | t_alarms_vaccinations | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | t_assessment_1 | 42 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie17-18.sql | t_assessment_2 | 55 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie17-18.sql | t_assessment_3 | 60 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie17-18.sql | t_assessment_4 | 55 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie17-18.sql | t_assessment_5 | 61 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie17-18.sql | t_assessment_6 | 67 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie17-18.sql | t_assessment_7 | 58 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie17-18.sql | t_assessment_dates | 4 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie17-18.sql | t_attachments | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_authorized | 12 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie17-18.sql | t_branch | 10 | 0 | covered by migrate-branches.ts |
| kiddzonl_garderie17-18.sql | t_child | 45 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie17-18.sql | t_child_draft | 32 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie17-18.sql | t_child_h | 45 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie17-18.sql | t_class | 21 | 0 | covered by migrate-classes.ts |
| kiddzonl_garderie17-18.sql | t_daily_attachments | 6 | 0 | covered by migrate-daily-reports.ts |
| kiddzonl_garderie17-18.sql | t_daily_fever | 6 | 0 | covered by migrate-daily-reports.ts |
| kiddzonl_garderie17-18.sql | t_daily_milk | 7 | 0 | covered by migrate-daily-reports.ts |
| kiddzonl_garderie17-18.sql | t_daily_report | 46 | 0 | covered by migrate-daily-reports.ts |
| kiddzonl_garderie17-18.sql | t_doctor | 16 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie17-18.sql | t_email | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_emp_status | 9 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_events | 10 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_events_types | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_food | 7 | 0 | covered by migrate-food-calendar.ts |
| kiddzonl_garderie17-18.sql | t_food_apply | 12 | 0 | covered by migrate-food-calendar.ts |
| kiddzonl_garderie17-18.sql | t_food_calendar | 11 | 0 | covered by migrate-food-calendar.ts |
| kiddzonl_garderie17-18.sql | t_form_1 | 26 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie17-18.sql | t_form_2 | 11 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie17-18.sql | t_form_3 | 55 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie17-18.sql | t_form_4 | 41 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie17-18.sql | t_form_5 | 19 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie17-18.sql | t_form_6 | 16 | 0 | covered by migrate-medical.ts + migrate-calls.ts |
| kiddzonl_garderie17-18.sql | t_forms_attachments | 10 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie17-18.sql | t_garderie | 68 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_garderie_attachments | 9 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_garderie_doctor | 22 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_garderie_doctor_attachments | 8 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_history_actions | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_holiday | 16 | 0 | covered by migrate-food-calendar.ts |
| kiddzonl_garderie17-18.sql | t_hr_alarms | 10 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_manager | 22 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie17-18.sql | t_manager_address | 10 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_manager_attachments | 8 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_med_forms_info | 15 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie17-18.sql | t_medical_forms | 5 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie17-18.sql | t_mouhafaza | 5 | 0 | covered by migrate-locations.ts |
| kiddzonl_garderie17-18.sql | t_notification_setting | 3 | 0 | covered by migrate-settings.ts |
| kiddzonl_garderie17-18.sql | t_notifications_log | 6 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie17-18.sql | t_nurse | 21 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie17-18.sql | t_nurse_attachments | 8 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie17-18.sql | t_old_garderie | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_parents | 17 | 0 | covered by migrate-parents.ts |
| kiddzonl_garderie17-18.sql | t_payments | 20 | 0 | covered by migrate-payments.ts |
| kiddzonl_garderie17-18.sql | t_quadaa | 6 | 0 | covered by migrate-locations.ts |
| kiddzonl_garderie17-18.sql | t_region | 6 | 0 | covered by migrate-locations.ts |
| kiddzonl_garderie17-18.sql | t_relatives | 12 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie17-18.sql | t_school_year | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_teacher | 46 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie17-18.sql | t_teacher_address | 10 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie17-18.sql | t_teacher_attachments | 8 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie17-18.sql | t_teacher_attendance | 12 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie17-18.sql | t_teacher_info | 9 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | t_daily_report | 63 | 5938 | covered by migrate-daily-reports.ts |
| kiddzonl_garderie29sept.sql | t_daily_milk | 7 | 1773 | covered by migrate-daily-reports.ts |
| kiddzonl_garderie29sept.sql | t_region | 6 | 1097 | covered by migrate-locations.ts |
| kiddzonl_garderie29sept.sql | custom_notifications_msg | 5 | 1084 | covered by migrate-messages.ts |
| kiddzonl_garderie29sept.sql | parent_login_timestamps | 4 | 904 | covered by migrate-login-audit.ts |
| kiddzonl_garderie29sept.sql | t_alarms_msg | 11 | 902 | covered by migrate-messages.ts |
| kiddzonl_garderie29sept.sql | custom_notifications_birthday | 3 | 671 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | custom_notifications_medical | 3 | 670 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_absent_report | 17 | 602 | covered by migrate-absences.ts |
| kiddzonl_garderie29sept.sql | t_food_apply | 12 | 572 | covered by migrate-food-calendar.ts |
| kiddzonl_garderie29sept.sql | t_alarms_payments | 10 | 556 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | custom_notifications_payments | 3 | 551 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_parents | 17 | 504 | covered by migrate-parents.ts |
| kiddzonl_garderie29sept.sql | t_notifications_log | 6 | 484 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_payments | 20 | 435 | covered by migrate-payments.ts |
| kiddzonl_garderie29sept.sql | newpayment | 10 | 419 | covered by migrate-payments.ts |
| kiddzonl_garderie29sept.sql | t_med_forms_info | 15 | 380 | covered by migrate-medical.ts |
| kiddzonl_garderie29sept.sql | t_authorized | 12 | 303 | covered by migrate-children.ts |
| kiddzonl_garderie29sept.sql | t_address | 19 | 253 | covered by migrate-children.ts |
| kiddzonl_garderie29sept.sql | t_relatives | 12 | 250 | covered by migrate-children.ts |
| kiddzonl_garderie29sept.sql | t_food_calendar | 11 | 196 | covered by migrate-food-calendar.ts |
| kiddzonl_garderie29sept.sql | t_alarms_medical | 10 | 146 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_alarms_birthday | 10 | 144 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_accounting | 29 | 114 | covered by migrate-payments.ts |
| kiddzonl_garderie29sept.sql | t_child_h | 45 | 114 | covered by migrate-children.ts |
| kiddzonl_garderie29sept.sql | t_holiday | 16 | 105 | covered by migrate-food-calendar.ts |
| kiddzonl_garderie29sept.sql | t_child | 45 | 79 | covered by migrate-children.ts |
| kiddzonl_garderie29sept.sql | t_forms_attachments | 10 | 72 | covered by migrate-medical.ts |
| kiddzonl_garderie29sept.sql | custom_notifications | 3 | 70 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_food | 7 | 51 | covered by migrate-food-calendar.ts |
| kiddzonl_garderie29sept.sql | callcauses | 3 | 46 | covered by migrate-calls.ts |
| kiddzonl_garderie29sept.sql | t_doctor | 16 | 39 | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | custom_notifications_contracts | 3 | 36 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | login_settings | 3 | 31 | covered by migrate-settings.ts |
| kiddzonl_garderie29sept.sql | parent_login_settings | 3 | 30 | covered by migrate-settings.ts |
| kiddzonl_garderie29sept.sql | t_teacher_info | 9 | 29 | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | t_teacher_address | 10 | 28 | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | notifications_tokens | 6 | 26 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | custom_notifications_insurance | 3 | 24 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_quadaa | 6 | 24 | covered by migrate-locations.ts |
| kiddzonl_garderie29sept.sql | t_form_1 | 26 | 21 | covered by migrate-medical.ts |
| kiddzonl_garderie29sept.sql | t_form_2 | 11 | 16 | covered by migrate-medical.ts |
| kiddzonl_garderie29sept.sql | t_form_4 | 41 | 16 | covered by migrate-medical.ts |
| kiddzonl_garderie29sept.sql | t_assessment_dates | 4 | 14 | covered by migrate-assessments.ts |
| kiddzonl_garderie29sept.sql | t_form_5 | 19 | 14 | covered by migrate-medical.ts |
| kiddzonl_garderie29sept.sql | t_daily_fever | 6 | 13 | covered by migrate-daily-reports.ts |
| kiddzonl_garderie29sept.sql | t_settings | 4 | 13 | covered by migrate-settings.ts |
| kiddzonl_garderie29sept.sql | notifications_nature | 13 | 11 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_teacher | 46 | 11 | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | t_teacher_attachments | 8 | 10 | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | t_alarms_contracts | 10 | 9 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_class | 21 | 9 | covered by migrate-classes.ts |
| kiddzonl_garderie29sept.sql | custom_notifications_vaccinations | 3 | 8 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_old_garderie | 6 | 8 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | new_assessment | 6 | 7 | covered by migrate-assessments.ts |
| kiddzonl_garderie29sept.sql | t_branch | 10 | 7 | covered by migrate-branches.ts |
| kiddzonl_garderie29sept.sql | t_garderie_attachments | 9 | 7 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_mouhafaza | 5 | 7 | covered by migrate-locations.ts |
| kiddzonl_garderie29sept.sql | callparent | 2 | 6 | covered by migrate-calls.ts |
| kiddzonl_garderie29sept.sql | t_alarms_insurance | 11 | 6 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | login_confirm | 6 | 5 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_alarms | 10 | 5 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_form_6 | 16 | 5 | covered by migrate-medical.ts + migrate-calls.ts |
| kiddzonl_garderie29sept.sql | t_form_3 | 55 | 4 | covered by migrate-medical.ts |
| kiddzonl_garderie29sept.sql | custom_notifications_medicine | 3 | 3 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_assessment_4 | 55 | 3 | covered by migrate-assessments.ts |
| kiddzonl_garderie29sept.sql | t_nurse | 21 | 3 | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | login_profiles | 5 | 2 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | parent_login_levels | 5 | 2 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_alarms_vaccinations | 10 | 2 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_garderie | 70 | 2 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_notification_setting | 3 | 2 | covered by migrate-settings.ts |
| kiddzonl_garderie29sept.sql | t_school_year | 3 | 2 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | login_profile_fields | 6 | 1 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | login_users | 12 | 1 | covered by migrate-users.ts |
| kiddzonl_garderie29sept.sql | parent_login_users | 10 | 1 | covered by migrate-parents.ts |
| kiddzonl_garderie29sept.sql | t_assessment_1 | 42 | 1 | covered by migrate-assessments.ts |
| kiddzonl_garderie29sept.sql | t_assessment_2 | 55 | 1 | covered by migrate-assessments.ts |
| kiddzonl_garderie29sept.sql | t_assessment_3 | 60 | 1 | covered by migrate-assessments.ts |
| kiddzonl_garderie29sept.sql | t_attachments | 6 | 1 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_events_types | 4 | 1 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_garderie_doctor | 22 | 1 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_garderie_doctor_attachments | 8 | 1 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_manager | 22 | 1 | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | t_manager_attachments | 8 | 1 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_nurse_attachments | 8 | 1 | covered by migrate-employees.ts |
| kiddzonl_garderie29sept.sql | custom_notifications_assessment | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | custom_notifications_birthday_parents | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | custom_notifications_events | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | custom_notifications_events_parents | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | custom_notifications_holiday | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | custom_notifications_insurance_parents | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | custom_notifications_medical_parents | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | custom_notifications_medicine_parents | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | custom_notifications_others | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | custom_notifications_others_parents | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | custom_notifications_parents | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | custom_notifications_requests | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | custom_notifications_requests_parents | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | login_integration | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | login_timestamps | 4 | 0 | covered by migrate-login-audit.ts |
| kiddzonl_garderie29sept.sql | t_absent_attachments | 6 | 0 | covered by migrate-absences.ts |
| kiddzonl_garderie29sept.sql | t_alarms_assessment | 10 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_alarms_assessment_parents | 10 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_alarms_medicine | 11 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_alarms_others | 10 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_alarms_parents | 10 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_alarms_requests | 10 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie29sept.sql | t_assessment_5 | 61 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie29sept.sql | t_assessment_6 | 67 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie29sept.sql | t_assessment_7 | 58 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie29sept.sql | t_child_draft | 32 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie29sept.sql | t_daily_attachments | 6 | 0 | covered by migrate-daily-reports.ts |
| kiddzonl_garderie29sept.sql | t_email | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_emp_status | 9 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_events | 10 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_history_actions | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_hr_alarms | 10 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_manager_address | 10 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | t_medical_forms | 5 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie29sept.sql | t_teacher_attendance | 12 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie29sept.sql | test | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | callcauses | 3 | 0 | covered by migrate-calls.ts |
| kiddzonl_garderie_2018-2019.sql | callparent | 2 | 0 | covered by migrate-calls.ts |
| kiddzonl_garderie_2018-2019.sql | custom_notifications | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | custom_notifications_assessment | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | custom_notifications_birthday | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | custom_notifications_contracts | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | custom_notifications_events | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | custom_notifications_holiday | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | custom_notifications_insurance | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | custom_notifications_medical | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | custom_notifications_medicine | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | custom_notifications_msg | 4 | 0 | covered by migrate-messages.ts |
| kiddzonl_garderie_2018-2019.sql | custom_notifications_payments | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | custom_notifications_vaccinations | 3 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | login_confirm | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | login_integration | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | login_profile_fields | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | login_profiles | 5 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | login_settings | 3 | 0 | covered by migrate-settings.ts |
| kiddzonl_garderie_2018-2019.sql | login_timestamps | 4 | 0 | covered by migrate-login-audit.ts |
| kiddzonl_garderie_2018-2019.sql | login_users | 12 | 0 | covered by migrate-users.ts |
| kiddzonl_garderie_2018-2019.sql | new_assessment | 6 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie_2018-2019.sql | newpayment | 10 | 0 | covered by migrate-payments.ts |
| kiddzonl_garderie_2018-2019.sql | parent_login_levels | 5 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | parent_login_settings | 3 | 0 | covered by migrate-settings.ts |
| kiddzonl_garderie_2018-2019.sql | parent_login_timestamps | 4 | 0 | covered by migrate-login-audit.ts |
| kiddzonl_garderie_2018-2019.sql | parent_login_users | 9 | 0 | covered by migrate-parents.ts |
| kiddzonl_garderie_2018-2019.sql | t_absent_attachments | 6 | 0 | covered by migrate-absences.ts |
| kiddzonl_garderie_2018-2019.sql | t_absent_report | 17 | 0 | covered by migrate-absences.ts |
| kiddzonl_garderie_2018-2019.sql | t_accounting | 29 | 0 | covered by migrate-payments.ts |
| kiddzonl_garderie_2018-2019.sql | t_address | 19 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie_2018-2019.sql | t_alarms | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | t_alarms_assessment | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | t_alarms_birthday | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | t_alarms_contracts | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | t_alarms_insurance | 10 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | t_alarms_medical | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | t_alarms_medicine | 10 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | t_alarms_msg | 11 | 0 | covered by migrate-messages.ts |
| kiddzonl_garderie_2018-2019.sql | t_alarms_payments | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | t_alarms_vaccinations | 9 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | t_assessment_1 | 42 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie_2018-2019.sql | t_assessment_2 | 55 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie_2018-2019.sql | t_assessment_3 | 60 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie_2018-2019.sql | t_assessment_4 | 55 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie_2018-2019.sql | t_assessment_5 | 61 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie_2018-2019.sql | t_assessment_6 | 67 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie_2018-2019.sql | t_assessment_7 | 58 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie_2018-2019.sql | t_assessment_dates | 4 | 0 | covered by migrate-assessments.ts |
| kiddzonl_garderie_2018-2019.sql | t_attachments | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_authorized | 12 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie_2018-2019.sql | t_branch | 10 | 0 | covered by migrate-branches.ts |
| kiddzonl_garderie_2018-2019.sql | t_child | 45 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie_2018-2019.sql | t_child_draft | 32 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie_2018-2019.sql | t_child_h | 45 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie_2018-2019.sql | t_class | 21 | 0 | covered by migrate-classes.ts |
| kiddzonl_garderie_2018-2019.sql | t_daily_attachments | 6 | 0 | covered by migrate-daily-reports.ts |
| kiddzonl_garderie_2018-2019.sql | t_daily_fever | 6 | 0 | covered by migrate-daily-reports.ts |
| kiddzonl_garderie_2018-2019.sql | t_daily_milk | 7 | 0 | covered by migrate-daily-reports.ts |
| kiddzonl_garderie_2018-2019.sql | t_daily_report | 46 | 0 | covered by migrate-daily-reports.ts |
| kiddzonl_garderie_2018-2019.sql | t_doctor | 16 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie_2018-2019.sql | t_email | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_emp_status | 9 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_events | 10 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_events_types | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_food | 7 | 0 | covered by migrate-food-calendar.ts |
| kiddzonl_garderie_2018-2019.sql | t_food_apply | 12 | 0 | covered by migrate-food-calendar.ts |
| kiddzonl_garderie_2018-2019.sql | t_food_calendar | 11 | 0 | covered by migrate-food-calendar.ts |
| kiddzonl_garderie_2018-2019.sql | t_form_1 | 26 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie_2018-2019.sql | t_form_2 | 11 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie_2018-2019.sql | t_form_3 | 55 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie_2018-2019.sql | t_form_4 | 41 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie_2018-2019.sql | t_form_5 | 19 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie_2018-2019.sql | t_form_6 | 16 | 0 | covered by migrate-medical.ts + migrate-calls.ts |
| kiddzonl_garderie_2018-2019.sql | t_forms_attachments | 10 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie_2018-2019.sql | t_garderie | 68 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_garderie_attachments | 9 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_garderie_doctor | 22 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_garderie_doctor_attachments | 8 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_history_actions | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_holiday | 16 | 0 | covered by migrate-food-calendar.ts |
| kiddzonl_garderie_2018-2019.sql | t_hr_alarms | 10 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_manager | 22 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie_2018-2019.sql | t_manager_address | 10 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_manager_attachments | 8 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_med_forms_info | 15 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie_2018-2019.sql | t_medical_forms | 5 | 0 | covered by migrate-medical.ts |
| kiddzonl_garderie_2018-2019.sql | t_mouhafaza | 5 | 0 | covered by migrate-locations.ts |
| kiddzonl_garderie_2018-2019.sql | t_notification_setting | 3 | 0 | covered by migrate-settings.ts |
| kiddzonl_garderie_2018-2019.sql | t_notifications_log | 6 | 0 | covered by migrate-alarms.ts |
| kiddzonl_garderie_2018-2019.sql | t_nurse | 21 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie_2018-2019.sql | t_nurse_attachments | 8 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie_2018-2019.sql | t_old_garderie | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_parents | 17 | 0 | covered by migrate-parents.ts |
| kiddzonl_garderie_2018-2019.sql | t_payments | 20 | 0 | covered by migrate-payments.ts |
| kiddzonl_garderie_2018-2019.sql | t_quadaa | 6 | 0 | covered by migrate-locations.ts |
| kiddzonl_garderie_2018-2019.sql | t_region | 6 | 0 | covered by migrate-locations.ts |
| kiddzonl_garderie_2018-2019.sql | t_relatives | 12 | 0 | covered by migrate-children.ts |
| kiddzonl_garderie_2018-2019.sql | t_school_year | 3 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_teacher | 46 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie_2018-2019.sql | t_teacher_address | 10 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie_2018-2019.sql | t_teacher_attachments | 8 | 0 | covered by migrate-employees.ts |
| kiddzonl_garderie_2018-2019.sql | t_teacher_attendance | 12 | 0 | not covered yet / needs explicit decision |
| kiddzonl_garderie_2018-2019.sql | t_teacher_info | 9 | 0 | covered by migrate-employees.ts |
| kiddzonl_master29sept.sql | login_timestamps | 4 | 69 | covered by migrate-login-audit.ts |
| kiddzonl_master29sept.sql | actions_control | 2 | 43 | not covered yet / needs explicit decision |
| kiddzonl_master29sept.sql | login_settings | 3 | 30 | covered by migrate-settings.ts |
| kiddzonl_master29sept.sql | system_actions | 6 | 24 | not covered yet / needs explicit decision |
| kiddzonl_master29sept.sql | users_control | 2 | 18 | not covered yet / needs explicit decision |
| kiddzonl_master29sept.sql | t_garderies | 7 | 8 | not covered yet / needs explicit decision |
| kiddzonl_master29sept.sql | login_confirm | 6 | 2 | not covered yet / needs explicit decision |
| kiddzonl_master29sept.sql | notifications | 5 | 2 | not covered yet / needs explicit decision |
| kiddzonl_master29sept.sql | login_levels | 5 | 1 | not covered yet / needs explicit decision |
| kiddzonl_master29sept.sql | login_users | 12 | 1 | covered by migrate-users.ts |
| kiddzonl_master29sept.sql | login_integration | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_master29sept.sql | login_profile_fields | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_master29sept.sql | login_profiles | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | login_timestamps | 4 | 6454 | covered by migrate-login-audit.ts |
| kiddzonl_users29sept.sql | actions_control | 2 | 104 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | login_timestamps_man | 4 | 76 | covered by migrate-login-audit.ts |
| kiddzonl_users29sept.sql | system_actions | 6 | 64 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | actions_control_man | 2 | 43 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | login_settings_man | 3 | 30 | covered by migrate-settings.ts |
| kiddzonl_users29sept.sql | system_actions_man | 6 | 24 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | users_control | 2 | 18 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | t_notification_setting | 6 | 14 | covered by migrate-settings.ts |
| kiddzonl_users29sept.sql | year_select | 2 | 10 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | t_class | 21 | 9 | covered by migrate-classes.ts |
| kiddzonl_users29sept.sql | login_levels | 5 | 7 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | t_branch | 10 | 7 | covered by migrate-branches.ts |
| kiddzonl_users29sept.sql | login_settings | 3 | 5 | covered by migrate-settings.ts |
| kiddzonl_users29sept.sql | login_confirm | 6 | 4 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | login_confirm_man | 6 | 2 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | login_levels_man | 5 | 2 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | year_db | 5 | 2 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | login_users | 12 | 1 | covered by migrate-users.ts |
| kiddzonl_users29sept.sql | login_users_man | 12 | 1 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | login_integration | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | login_integration_man | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | login_profile_fields | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | login_profile_fields_man | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | login_profiles | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users29sept.sql | login_profiles_man | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | actions_control | 2 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | actions_control_man | 2 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | login_confirm | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | login_confirm_man | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | login_integration | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | login_integration_man | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | login_levels | 5 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | login_levels_man | 5 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | login_profile_fields | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | login_profile_fields_man | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | login_profiles | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | login_profiles_man | 4 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | login_settings | 3 | 0 | covered by migrate-settings.ts |
| kiddzonl_users_2018-2019.sql | login_settings_man | 3 | 0 | covered by migrate-settings.ts |
| kiddzonl_users_2018-2019.sql | login_timestamps | 4 | 0 | covered by migrate-login-audit.ts |
| kiddzonl_users_2018-2019.sql | login_timestamps_man | 4 | 0 | covered by migrate-login-audit.ts |
| kiddzonl_users_2018-2019.sql | login_users | 12 | 0 | covered by migrate-users.ts |
| kiddzonl_users_2018-2019.sql | login_users_man | 12 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | system_actions | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | system_actions_man | 6 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | t_branch | 10 | 0 | covered by migrate-branches.ts |
| kiddzonl_users_2018-2019.sql | t_class | 21 | 0 | covered by migrate-classes.ts |
| kiddzonl_users_2018-2019.sql | t_notification_setting | 6 | 0 | covered by migrate-settings.ts |
| kiddzonl_users_2018-2019.sql | users_control | 2 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | year_db | 5 | 0 | not covered yet / needs explicit decision |
| kiddzonl_users_2018-2019.sql | year_select | 2 | 0 | not covered yet / needs explicit decision |

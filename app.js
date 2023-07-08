const express = require("express");
const { Pool } = require("pg");
const fs = require("fs");
const dbConfig1 = {
  user: "postgres",
  host: "182.168.7.83",
  database: "LIS_MARGONO",
  password: "p@ssw0rd",
  port: 5433, // default PostgreSQL port
};

const dbConfig2 = {
  user: "postgres",
  host: "182.168.7.93",
  database: "DEV_MARGONO",
  password: "",
  port: 5433, // default PostgreSQL port
};

const pool1 = new Pool(dbConfig1, {
  connectionTimeoutMillis: 500000000,
});
const pool2 = new Pool(dbConfig2, {
  connectionTimeoutMillis: 500000000,
});

const app = express();

app.post("/data", async (req, res) => {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const client1 = await pool1.connect();
    console.log("CONNECTED");
    const result1 = await client1.query("SELECT * FROM e_bridge_receive WHERE created_at BETWEEN $1 AND $2", [startDate, endDate]);
    // client1.release(); // Release the client back to the pool

    const client2 = await pool2.connect();
    resultRecovery = Promise.all(
      result1.rows.map(async (element) => {
        const eBridgeReceive = await client2.query("SELECT * FROM e_bridge_receive WHERE ono='" + element.ono + "' LIMIT 1");
        const tPatientRegistration = await client1.query("SELECT * FROM t_patient_registration WHERE reg_num='" + element.lno + "' LIMIT 1");
        let tPatientRegistrationItem = tPatientRegistration.rows[0];
        // insert e bridge receive
        element.created_at = new Date(element.created_at).toISOString();
        if (eBridgeReceive.rowCount === 0 && tPatientRegistration.rowCount === 1) {
          let tPatientOrderDetail = await client1.query("SELECT * FROM t_patient_order_detail WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
          let tPatientOrder = await client1.query("SELECT * FROM t_patient_order WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
          if (tPatientOrder.rowCount > 0) {
            let tPatientSample = await client1.query("SELECT * FROM t_patient_sample WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
            let tPatientSampleSpeciment = await client1.query("SELECT * FROM t_patient_sample_speciment WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
            let tPatientPayment = await client1.query("SELECT * FROM t_patient_payment WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");

            let tPatientExamination = await client1.query("SELECT * FROM t_patient_examination WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");

            let tCommentSample = await client1.query("SELECT * FROM t_comment_sample WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
            let tPatientDiagnose = await client1.query("SELECT * FROM t_patient_diagnose WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
            let tPatientExamMicro = await client1.query("SELECT * FROM t_patient_exam_microbiology WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");

            element.updated_at = new Date(element.updated_at).toISOString();
            element.release_date = new Date(element.release_date).toISOString();
            element.split_date = new Date(element.split_date).toISOString();
            let contentEBR = "INSERT INTO e_bridge_receive (ono, lno, text_result, text_order, release_date, validate, created_at, updated_at, split_date, source, result_message_id) VALUES('" + element.ono + "' ,'" + element.lno + "','" + element.text_result + "', '" + element.text_order + "' , '" + element.release_date + "','" + element.release_date + "','" + element.created_at + "','" + element.updated_at + "','" + element.split_date + "', '" + element.source + "', '" + element.result_message_id + "');";

            tPatientRegistrationItem.created_at = `'${new Date(tPatientRegistrationItem.created_at).toISOString()}'`;
            tPatientRegistrationItem.updated_at = `'${new Date(tPatientRegistrationItem.updated_at).toISOString()}'`;
            tPatientRegistrationItem.cancelation_date = `'${new Date(tPatientRegistrationItem.cancelation_date).toISOString()}'`;
            tPatientRegistrationItem.registration_date = `'${new Date(tPatientRegistrationItem.registration_date).toISOString()}'`;

            tPatientRegistrationItem.patient_type = !tPatientRegistrationItem.patient_type ? tPatientRegistrationItem.patient_type : `'${tPatientRegistrationItem.patient_type}'`;
            tPatientRegistrationItem.fast_note = tPatientRegistrationItem.fast_note ? `'${tPatientRegistrationItem.fast_note}'` : null;
            // tPatientRegistrationItem.fast_note = !tPatientRegistrationItem.fast_note ? tPatientRegistrationItem.fast_note : `'${tPatientRegistrationItem.fast_note}'`;
            tPatientRegistrationItem.mrn = !tPatientRegistrationItem.mrn ? tPatientRegistrationItem.mrn : `'${tPatientRegistrationItem.mrn}'`;
            tPatientRegistrationItem.guarantor = !tPatientRegistrationItem.guarantor ? tPatientRegistrationItem.guarantor : `'${tPatientRegistrationItem.guarantor}'`;
            tPatientRegistrationItem.members_number = !tPatientRegistrationItem.members_number ? tPatientRegistrationItem.members_number : `'${tPatientRegistrationItem.members_number}'`;
            tPatientRegistrationItem.referral_type = !tPatientRegistrationItem.referral_type ? tPatientRegistrationItem.referral_type : `'${tPatientRegistrationItem.referral_type}'`;
            tPatientRegistrationItem.uid_ward = !tPatientRegistrationItem.uid_ward ? tPatientRegistrationItem.uid_ward : `'${tPatientRegistrationItem.uid_ward}'`;
            tPatientRegistrationItem.uid_class = !tPatientRegistrationItem.uid_class ? tPatientRegistrationItem.uid_class : `'${tPatientRegistrationItem.uid_class}'`;
            tPatientRegistrationItem.uid_doctor_referral = !tPatientRegistrationItem.uid_doctor_referral ? tPatientRegistrationItem.uid_doctor_referral : `'${tPatientRegistrationItem.uid_doctor_referral}'`;
            tPatientRegistrationItem.reg_num = !tPatientRegistrationItem.reg_num ? tPatientRegistrationItem.reg_num : `'${tPatientRegistrationItem.reg_num}'`;
            tPatientRegistrationItem.created_by = !tPatientRegistrationItem.created_by ? tPatientRegistrationItem.created_by : `'${tPatientRegistrationItem.created_by}'`;
            tPatientRegistrationItem.uid_updated_by = tPatientRegistrationItem.uid_updated_by = !tPatientRegistrationItem.uid_updated_by ? tPatientRegistrationItem.uid_updated_by : `'${tPatientRegistrationItem.uid_updated_by}'`;
            tPatientRegistrationItem.uid = !tPatientRegistrationItem.uid ? tPatientRegistrationItem.uid : `'${tPatientRegistrationItem.uid}'`;
            tPatientRegistrationItem.uid_profile = !tPatientRegistrationItem.uid_profile ? tPatientRegistrationItem.uid_profile : `'${tPatientRegistrationItem.uid_profile}'`;
            tPatientRegistrationItem.uid_object = !tPatientRegistrationItem.uid_object ? tPatientRegistrationItem.uid_object : `'${tPatientRegistrationItem.uid_object}'`;
            tPatientRegistrationItem.room_number = !tPatientRegistrationItem.room_number ? tPatientRegistrationItem.room_number : `'${tPatientRegistrationItem.room_number}'`;
            tPatientRegistrationItem.source = !tPatientRegistrationItem.source ? tPatientRegistrationItem.source : `'${tPatientRegistrationItem.source}'`;
            tPatientRegistrationItem.no_reg = !tPatientRegistrationItem.no_reg ? tPatientRegistrationItem.no_reg : `'${tPatientRegistrationItem.no_reg}'`;
            tPatientRegistrationItem.sign_fast = !tPatientRegistrationItem.sign_fast ? tPatientRegistrationItem.sign_fast : `'${tPatientRegistrationItem.sign_fast}'`;
            tPatientRegistrationItem.fast_note = !tPatientRegistrationItem.fast_note ? tPatientRegistrationItem.fast_note : `'${tPatientRegistrationItem.fast_note}'`;
            tPatientRegistrationItem.uid_doctor_incharge = !tPatientRegistrationItem.uid_doctor_incharge ? tPatientRegistrationItem.uid_doctor_incharge : `'${tPatientRegistrationItem.uid_doctor_incharge}'`;
            tPatientRegistrationItem.uid_facility_referral = !tPatientRegistrationItem.uid_facility_referral ? tPatientRegistrationItem.uid_facility_referral : `'${tPatientRegistrationItem.uid_facility_referral}'`;
            tPatientRegistrationItem.uid_doctor = !tPatientRegistrationItem.uid_doctor ? tPatientRegistrationItem.uid_doctor : `'${tPatientRegistrationItem.uid_doctor}'`;
            let contentTPR = "INSERT INTO t_patient_registration (mrn, patient_type, guarantor, members_number, referral_type, uid_ward, uid_class, uid_doctor_referral, uid_facility_referral, uid_doctor, is_cyto, reg_num, registration_date,created_by, uid_updated_by, uid, enabled, uid_profile, uid_object, created_at, updated_at, cancelation_remark, cancelation_date, is_bridge, room_number, source, no_reg, sign_fast, fast_note, is_pregnant, is_mcu, uid_doctor_incharge) VALUES(" + tPatientRegistrationItem.mrn + " ," + tPatientRegistrationItem.patient_type + "," + tPatientRegistrationItem.guarantor + ", " + tPatientRegistrationItem.members_number + " , " + tPatientRegistrationItem.referral_type + ", " + tPatientRegistrationItem.uid_ward + ", " + tPatientRegistrationItem.uid_class + ", " + tPatientRegistrationItem.uid_doctor_referral + ", " + tPatientRegistrationItem.uid_facility_referral + ", " + tPatientRegistrationItem.uid_doctor + ", " + tPatientRegistrationItem.is_cyto + ", " + tPatientRegistrationItem.reg_num + ", " + tPatientRegistrationItem.registration_date + ", " + tPatientRegistrationItem.created_by + ", " + tPatientRegistrationItem.uid_updated_by + ", " + tPatientRegistrationItem.uid + ", " + tPatientRegistrationItem.enabled + ", " + tPatientRegistrationItem.uid_profile + ", " + tPatientRegistrationItem.uid_object + ", " + tPatientRegistrationItem.created_at + ", " + tPatientRegistrationItem.updated_at + ", " + tPatientRegistrationItem.cancelation_remark + ", " + tPatientRegistrationItem.cancelation_date + ", " + tPatientRegistrationItem.is_bridge + ", " + tPatientRegistrationItem.room_number + ", " + tPatientRegistrationItem.source + ", " + tPatientRegistrationItem.no_reg + ", " + tPatientRegistrationItem.sign_fast + ", " + tPatientRegistrationItem.fast_note + ", " + tPatientRegistrationItem.is_pregnant + ", " + tPatientRegistrationItem.is_mcu + ", " + tPatientRegistrationItem.uid_doctor_incharge + ");";

            // t patient order
            let contentTPO = tPatientOrder.rows.map((element) => {
              if (!element) {
                return "";
              }

              // element.created_at = element.created_at = new Date(element.created_at).toISOString();
              // element.updated_at = element.updated_at = new Date(element.updated_at).toISOString();
              // element.mrn = !element.mrn ? element.mrn : element.mrn;
              // element.uid_registration = !element.uid_registration ? element.uid_registration : element.uid_registration;
              // element.uid_test = !element.uid_test ? element.uid_test : element.uid_test;
              // element.id_type_test = !element.id_type_test ? element.id_type_test : element.id_type_test;
              // element.quantity = !element.quantity ? element.quantity : element.quantity;
              // element.uid_created_by = !element.uid_created_by ? element.uid_created_by : element.uid_created_by;
              // element.uid_updated_by = !element.uid_updated_by ? element.uid_updated_by : element.uid_updated_by;
              // element.uid = !element.uid ? element.uid : element.uid;
              // element.uid_profile = !element.uid_profile ? element.uid_profile : element.uid_profile;
              // element.uid_object = !element.uid_object ? element.uid_object : element.uid_object;
              // element.created_at = !element.created_at ? element.created_at : element.created_at;
              // element.updated_at = !element.updated_at ? element.updated_at : element.updated_at;

              element.created_at = element.created_at ? `${new Date(element.created_at).toISOString()}` : element.created_at;
              element.updated_at = element.updated_at ? `${new Date(element.updated_at).toISOString()}` : element.updated_at;
              element.mrn = element.mrn ? `'${element.mrn}'` : element.mrn;
              element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
              element.uid_test = element.uid_test ? `'${element.uid_test}'` : element.uid_test;
              element.id_type_test = element.id_type_test ? `'${element.id_type_test}'` : element.id_type_test;
              element.quantity = element.quantity ? `'${element.quantity}'` : element.quantity;
              element.uid_created_by = element.uid_created_by ? `'${element.uid_created_by}'` : element.uid_created_by;
              element.uid_updated_by = element.uid_updated_by ? `'${element.uid_updated_by}'` : element.uid_updated_by;
              element.uid = element.uid ? `'${element.uid}'` : element.uid;
              element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
              element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;
              element.created_at = element.created_at ? `'${element.created_at}'` : element.created_at;
              element.updated_at = element.updated_at ? `'${element.updated_at}'` : element.updated_at;

              return "INSERT INTO t_patient_order (mrn, uid_registration, uid_test, id_type_test, quantity, uid_created_by, uid_updated_by, enabled, uid, uid_profile, uid_object, created_at, updated_at, is_bridge) VALUES(" + element.mrn + ", " + element.uid_registration + ", " + element.uid_test + ", " + element.id_type_test + ", " + element.quantity + ", " + element.uid_created_by + ", " + element.uid_updated_by + ", " + element.enabled + ", " + element.uid + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ", " + element.is_bridge + ");" + "\n";
            })[0];

            let contentTPOD = tPatientOrderDetail.rows.map((element) => {
              if (!element) {
                return "";
              }

              element.created_at = `'${new Date(element.created_at).toISOString()}'`;
              element.acc_date = `'${new Date(element.acc_date).toISOString()}'`;
              element.verify_date = `'${new Date(element.verify_date).toISOString()}'`;
              element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;

              element.mrn = !element.mrn ? element.mrn : `'${element.mrn}'`;
              element.value = !element.value ? element.value : `'${element.value}'`;
              element.value_string = !element.value_string ? element.value_string : `'${element.value_string}'`;
              element.value_memo = !element.value_memo ? element.value_memo : `'${element.value_memo}'`;
              element.uid_verify_by = !element.uid_verify_by ? element.uid_verify_by : `'${element.uid_verify_by}'`;
              element.uid_instrument = !element.uid_instrument ? element.uid_instrument : `'${element.uid_instrument}'`;
              element.uid_acc_by = !element.uid_acc_by ? element.uid_acc_by : `'${element.uid_acc_by}'`;
              element.uid_action_by = !element.uid_action_by ? element.uid_action_by : `'${element.uid_action_by}'`;
              element.uid_profile = !element.uid_profile ? element.uid_profile : `'${element.uid_profile}'`;
              element.uid_object = !element.uid_object ? element.uid_object : `'${element.uid_object}'`;
              element.uid = !element.uid ? element.uid : `'${element.uid}'`;
              element.flag = !element.flag ? element.flag : `'${element.flag}'`;
              element.uid_nilai_normal = !element.uid_nilai_normal ? element.uid_nilai_normal : `'${element.uid_nilai_normal}'`;
              element.uid_package = !element.uid_package ? element.uid_package : `'${element.uid_package}'`;
              element.uid_panel = !element.uid_panel ? element.uid_panel : `'${element.uid_panel}'`;
              element.uid_parent = !element.uid_parent ? element.uid_parent : `'${element.uid_parent}'`;
              element.uid_registration = !element.uid_registration ? element.uid_registration : `'${element.uid_registration}'`;
              element.uid_test = !element.uid_test ? element.uid_test : `'${element.uid_test}'`;

              return "INSERT INTO t_patient_order_detail (mrn, uid_registration, uid_test, value, value_string, value_memo, is_verify, verify_date, uid_verify_by, uid_instrument, is_acc, acc_date, is_edit, uid_acc_by, uid_action_by, enabled, uid_profile, uid_object, uid, flag, uid_nilai_normal, uid_package, uid_panel, uid_parent, created_at, updated_at, approve_mobile, id_order) VALUES(" + element.mrn + ", " + element.uid_registration + ", " + element.uid_test + ", " + element.value + " , " + element.value_string + ", " + element.value_memo + ", " + element.is_verify + ", " + element.verify_date + ", " + element.uid_verify_by + ", " + element.uid_instrument + ", " + element.is_acc + ", " + element.acc_date + ", " + element.is_edit + ", " + element.uid_acc_by + ", " + element.uid_action_by + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.uid + ", " + element.flag + ", " + element.uid_nilai_normal + ", " + element.uid_package + ", " + element.uid_panel + ", " + element.uid_parent + ", " + element.created_at + ", " + element.updated_at + ", " + element.approve_mobile + ", " + element.id_order + ");" + "\n";
            })[0];

            let contentTPS = tPatientSample.rows.map((element) => {
              if (!element) {
                return "";
              }

              element.created_at = `'${new Date(element.created_at).toISOString()}'`;
              element.taken_date = `'${new Date(element.taken_date).toISOString()}'`;
              element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;

              element.sample_num = !element.sample_num ? element.sample_num : `'${element.sample_num}'`;
              element.mrn = !element.mrn ? element.mrn : `'${element.mrn}'`;
              element.uid_registration = !element.uid_registration ? element.uid_registration : `'${element.uid_registration}'`;
              element.uid_test = !element.uid_test ? element.uid_test : `'${element.uid_test}'`;
              element.taken_date = !element.taken_date ? element.taken_date : `${element.taken_date}`;
              element.type_ref = !element.type_ref ? element.type_ref : `'${element.type_ref}'`;
              element.qty_print = !element.qty_print ? element.qty_print : `'${element.qty_print}'`;
              element.uid_paket = !element.uid_paket ? element.uid_paket : `'${element.uid_paket}'`;
              element.uid_panel = !element.uid_panel ? element.uid_panel : `'${element.uid_panel}'`;
              element.uid = !element.uid ? element.uid : `'${element.uid}'`;
              element.uid_profile = !element.uid_profile ? element.uid_profile : `'${element.uid_profile}'`;
              element.uid_object = !element.uid_object ? element.uid_object : `'${element.uid_object}'`;
              element.uid_by = !element.uid_by ? element.uid_by : `'${element.uid_by}'`;
              element.read_by = !element.read_by ? element.read_by : `'${element.read_by}'`;

              return "INSERT INTO t_patient_sample (sample_num, mrn, uid_registration, uid_test, taken_date, type_ref, qty_print, uid_paket, uid_panel, uid, enabled, uid_profile, uid_object, created_at, updated_at, uid_by, is_read, read_by) VALUES(" + element.sample_num + ", " + element.mrn + ", " + element.uid_registration + ", " + element.uid_test + ", " + element.taken_date + ", " + element.type_ref + ", " + element.qty_print + ", " + element.uid_paket + ", " + element.uid_panel + ", " + element.uid + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ", " + element.uid_by + ", " + element.is_read + ", " + element.read_by + ");" + "\n";
            })[0];
            contentTPS = contentTPS ? contentTPS : "";
            let contentTPSS = tPatientSampleSpeciment.rows.map((element) => {
              if (!element) {
                return "";
              }

              element.created_at = `'${new Date(element.created_at).toISOString()}'`;
              element.taken_date = `'${new Date(element.taken_date).toISOString()}'`;
              element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;

              element.specimen = element.specimen ? `'${element.specimen}'` : element.specimen;
              element.reg_num = element.reg_num ? `'${element.reg_num}'` : element.reg_num;
              element.mrn = element.mrn ? `'${element.mrn}'` : element.mrn;
              element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
              element.uid_test = element.uid_test ? `'${element.uid_test}'` : element.uid_test;
              element.taken_date = element.taken_date ? `${element.taken_date}` : element.taken_date;
              element.uid_paket = element.uid_paket ? `'${element.uid_paket}'` : element.uid_paket;
              element.uid_panel = element.uid_panel ? `'${element.uid_panel}'` : element.uid_panel;
              element.uid = element.uid ? `'${element.uid}'` : element.uid;
              element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
              element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;

              return "INSERT INTO t_patient_sample_speciment (reg_num, mrn, specimen, uid_registration, uid_test, taken_date, qty_print, uid_paket, uid_panel, uid, enabled, uid_profile, uid_object, created_at, updated_at) VALUES(" + element.reg_num + ", " + element.mrn + ", " + element.specimen + ", " + element.uid_registration + ", " + element.uid_test + ", " + element.taken_date + ", " + element.qty_print + ", " + element.uid_paket + ", " + element.uid_panel + ", " + element.uid + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ");" + "\n";
            })[0];
            contentTPSS = contentTPSS ? contentTPSS : "";

            let contentTPE = await Promise.all(
              tPatientExamination.rows.map(async (element) => {
                // if (!element) {
                //   return "";
                // }

                let tCommentTest = await client1.query("SELECT * FROM t_comment_test WHERE uid_examination='" + element.uid + "'");
                let tHistoryApprove = await client1.query("SELECT * FROM t_history_approve WHERE uid_examination='" + element.uid + "'");
                let tHistoryVerify = await client1.query("SELECT * FROM t_history_verify WHERE uid_examination='" + element.uid + "'");
                let tPatientExaminationCritical = await client1.query("SELECT * FROM t_patient_examination_critical WHERE uid_patient_exam='" + element.uid + "'");

                element.created_at = `'${new Date(element.created_at).toISOString()}'`;
                element.pending_date = `'${new Date(element.pending_date).toISOString()}'`;
                element.acc_date = `'${new Date(element.acc_date).toISOString()}'`;
                element.verify_date = `'${new Date(element.verify_date).toISOString()}'`;
                element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;

                element.mrn = element.mrn ? `'${element.mrn}'` : element.mrn;
                element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
                element.uid_test = element.uid_test ? `'${element.uid_test}'` : element.uid_test;
                element.value = element.value ? `'${element.value}'` : element.value;
                element.value_string = element.value_string ? `'${element.value_string}'` : element.value_string;
                element.value_memo = element.value_memo ? `'${element.value_memo}'` : element.value_memo;
                element.uid_verify_by = element.uid_verify_by ? `'${element.uid_verify_by}'` : element.uid_verify_by;
                element.uid_instrument = element.uid_instrument ? `'${element.uid_instrument}'` : element.uid_instrument;
                element.uid_acc_by = element.uid_acc_by ? `'${element.uid_acc_by}'` : element.uid_acc_by;
                element.uid_created_by = element.uid_created_by ? `'${element.uid_created_by}'` : element.uid_created_by;
                element.uid_action_by = element.uid_action_by ? `'${element.uid_action_by}'` : element.uid_action_by;
                element.pending_by = element.pending_by ? `'${element.pending_by}'` : element.pending_by;
                element.uid = element.uid ? `'${element.uid}'` : element.uid;
                element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
                element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;
                element.uid_rolebase = element.uid_rolebase ? `'${element.uid_rolebase}'` : element.uid_rolebase;
                element.uid_panel = element.uid_panel ? `'${element.uid_panel}'` : element.uid_panel;
                element.flag = element.flag ? `'${element.flag}'` : element.flag;
                element.uid_parent = element.uid_parent ? `'${element.uid_parent}'` : element.uid_parent;
                element.uid_nilai_normal = element.uid_nilai_normal ? `'${element.uid_nilai_normal}'` : element.uid_nilai_normal;

                examContent = "INSERT INTO t_patient_examination (mrn, uid_registration, uid_test, value, value_string, value_memo, is_verify, verify_date, print_date, uid_verify_by, uid_instrument, is_acc, acc_date, is_edit, flag, pending_date, pending_by, uid_acc_by, uid_created_by, uid_action_by, uid_package, uid_panel, uid_parent, uid_nilai_normal, uid, enabled, uid_profile, uid_object, created_at, updated_at, approve_mobile, uid_rolebase, role_text, sign, id_order, is_duplo) VALUES(" + element.mrn + ", " + element.uid_registration + ", " + element.uid_test + ", " + element.value + ", " + element.value_string + ", " + element.value_memo + ", " + element.is_verify + ", " + element.verify_date + ", " + element.print_date + ", " + element.uid_verify_by + ", " + element.uid_instrument + ", " + element.is_acc + ", " + element.acc_date + ", " + element.is_edit + ", " + element.flag + ", " + element.pending_date + ", " + element.pending_by + ", " + element.uid_acc_by + ", " + element.uid_created_by + ", " + element.uid_action_by + ", " + element.uid_package + ", " + element.uid_panel + ", " + element.uid_parent + ", " + element.uid_nilai_normal + ", " + element.uid + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + "," + element.created_at + ", " + element.updated_at + ", " + element.approve_mobile + ", " + element.uid_rolebase + "," + element.role_text + "," + element.sign + ", " + element.id_order + "," + element.is_duplo + ");\n";

                if (tPatientExaminationCritical.rowCount > 0) {
                  tPatientExaminationCritical.rows[0].remark = tPatientExaminationCritical.rows[0].remark ? `'${tPatientExaminationCritical.rows[0].remark}'` : tPatientExaminationCritical.rows[0].remark;
                  tPatientExaminationCritical.rows[0].uid_user_by = tPatientExaminationCritical.rows[0].uid_user_by ? `'${tPatientExaminationCritical.rows[0].uid_user_by}'` : tPatientExaminationCritical.rows[0].uid_user_by;
                  tPatientExaminationCritical.rows[0].uid_user_to = tPatientExaminationCritical.rows[0].uid_user_to ? `'${tPatientExaminationCritical.rows[0].uid_user_to}'` : tPatientExaminationCritical.rows[0].uid_user_to;
                  tPatientExaminationCritical.rows[0].uid = tPatientExaminationCritical.rows[0].uid ? `'${tPatientExaminationCritical.rows[0].uid}'` : tPatientExaminationCritical.rows[0].uid;
                  tPatientExaminationCritical.rows[0].uid_profile = tPatientExaminationCritical.rows[0].uid_profile ? `'${tPatientExaminationCritical.rows[0].uid_profile}'` : tPatientExaminationCritical.rows[0].uid_profile;
                  tPatientExaminationCritical.rows[0].uid_object = tPatientExaminationCritical.rows[0].uid_object ? `'${tPatientExaminationCritical.rows[0].uid_object}'` : tPatientExaminationCritical.rows[0].uid_object;
                  tPatientExaminationCritical.rows[0].uid = tPatientExaminationCritical.rows[0].uid ? `${tPatientExaminationCritical.rows[0].uid}` : tPatientExaminationCritical.rows[0].uid;
                  tPatientExaminationCritical.rows[0].created_at = tPatientExaminationCritical.rows[0].created_at ? `'${new Date(tPatientExaminationCritical.rows[0].created_at).toISOString()}'` : tPatientExaminationCritical.rows[0].created_at;
                  tPatientExaminationCritical.rows[0].updated_at = tPatientExaminationCritical.rows[0].updated_at ? `'${new Date(tPatientExaminationCritical.rows[0].updated_at).toISOString()}'` : tPatientExaminationCritical.rows[0].updated_at;
                  tPatientExaminationCritical.rows[0].uid_patient_exam = tPatientExaminationCritical.rows[0].uid_patient_exam ? `'${tPatientExaminationCritical.rows[0].uid_patient_exam}'` : tPatientExaminationCritical.rows[0].uid_patient_exam;
                  tPatientExaminationCritical.rows[0].confirm_date = tPatientExaminationCritical.rows[0].confirm_date ? `'${new Date(tPatientExaminationCritical.rows[0].confirm_date).toISOString()}'` : tPatientExaminationCritical.rows[0].confirm_date;
                  // tPatientExaminationCritical.rows[0].confirm_date = new Date(tPatientExaminationCritical.rows[0].confirm_date).toISOString();

                  examContent += "INSERT INTO t_patient_examination_critical (uid_patient_exam, remark, uid_user_by, uid_user_to, uid, enabled, uid_profile, uid_object,  created_at, updated_at, confirm_date, confirm_user) VALUES(" + tPatientExaminationCritical.rows[0].uid_patient_exam + ", " + tPatientExaminationCritical.rows[0].remark + ", " + tPatientExaminationCritical.rows[0].uid_user_by + ", " + tPatientExaminationCritical.rows[0].uid_user_to + ", " + tPatientExaminationCritical.rows[0].uid + ", " + tPatientExaminationCritical.rows[0].uid_profile + ", " + tPatientExaminationCritical.rows[0].uid_object + ", " + tPatientExaminationCritical.rows[0].created_at + ", " + tPatientExaminationCritical.rows[0].uid_object + ", " + tPatientExaminationCritical.rows[0].created_at + ", " + tPatientExaminationCritical.rows[0].updated_at + ", " + tPatientExaminationCritical.rows[0].confirm_date + ", " + tPatientExaminationCritical.rows[0].confirm_user + ");\n";
                }

                if (tCommentTest.rowCount > 0) {
                  tCommentTest.rows[0].uid_examination = tCommentTest.rows[0].uid_examination ? `'${tCommentTest.rows[0].uid_examination}'` : tCommentTest.rows[0].uid_examination;
                  tCommentTest.rows[0].uid = tCommentTest.rows[0].uid ? `'${tCommentTest.rows[0].uid}'` : tCommentTest.rows[0].uid;
                  tCommentTest.rows[0].status_by = tCommentTest.rows[0].status_by ? `'${tCommentTest.rows[0].status_by}'` : tCommentTest.rows[0].status_by;
                  // tCommentTest.rows[0].status = tCommentTest.rows[0].status ? `'${tCommentTest.rows[0].status}'` : tCommentTest.rows[0].status;
                  tCommentTest.rows[0].uid_comment_by = tCommentTest.rows[0].uid_comment_by ? `'${tCommentTest.rows[0].uid_comment_by}'` : tCommentTest.rows[0].uid_comment_by;
                  tCommentTest.rows[0].uid_profile = tCommentTest.rows[0].uid_profile ? `'${tCommentTest.rows[0].uid_profile}'` : tCommentTest.rows[0].uid_profile;
                  tCommentTest.rows[0].uid_object = tCommentTest.rows[0].uid_object ? `'${tCommentTest.rows[0].uid_object}'` : tCommentTest.rows[0].uid_object;
                  tCommentTest.rows[0].comment = tCommentTest.rows[0].comment ? `'${tCommentTest.rows[0].comment}'` : null;
                  tCommentTest.rows[0].uid_comment_by = tCommentTest.rows[0].uid_comment_by ? `${tCommentTest.rows[0].uid_comment_by}` : tCommentTest.rows[0].uid_comment_by;
                  tCommentTest.rows[0].created_at = tCommentTest.rows[0].created_at ? `'${new Date(tCommentTest.rows[0].created_at).toISOString()}'` : tCommentTest.rows[0].created_at;
                  tCommentTest.rows[0].updated_at = tCommentTest.rows[0].updated_at ? `'${new Date(tCommentTest.rows[0].updated_at).toISOString()}'` : tCommentTest.rows[0].updated_at;

                  examContent += "INSERT INTO t_comment_test (uid_examination, uid, comment, uid_comment_by, status, status_by, status_date, enabled, uid_profile, uid_object, created_at, updated_at) VALUES(" + tCommentTest.rows[0].uid_examination + ", " + tCommentTest.rows[0].uid + ", " + tCommentTest.rows[0].comment + ", " + tCommentTest.rows[0].uid_comment_by + "," + tCommentTest.rows[0].status + ", " + tCommentTest.rows[0].status_by + ", " + tCommentTest.rows[0].status_date + ", " + tCommentTest.rows[0].enabled + ", " + tCommentTest.rows[0].uid_profile + ", " + tCommentTest.rows[0].uid_object + ", " + tCommentTest.rows[0].created_at + ", " + tCommentTest.rows[0].updated_at + ");\n";
                }

                if (tHistoryApprove.rowCount > 0) {
                  tHistoryApprove.rows[0].uid_examination = tHistoryApprove.rows[0].uid_examination ? `'${tHistoryApprove.rows[0].uid_examination}'` : tHistoryApprove.rows[0].uid_examination;
                  tHistoryApprove.rows[0].uid = tHistoryApprove.rows[0].uid ? `'${tHistoryApprove.rows[0].uid}'` : tHistoryApprove.rows[0].uid;
                  tHistoryApprove.rows[0].uid_test = tHistoryApprove.rows[0].uid_test ? `'${tHistoryApprove.rows[0].uid_test}'` : tHistoryApprove.rows[0].uid_test;
                  tHistoryApprove.rows[0].uid_acc_by = tHistoryApprove.rows[0].uid_acc_by ? `'${tHistoryApprove.rows[0].uid_acc_by}'` : tHistoryApprove.rows[0].uid_acc_by;
                  tHistoryApprove.rows[0].uid_profile = tHistoryApprove.rows[0].uid_profile ? `'${tHistoryApprove.rows[0].uid_profile}'` : tHistoryApprove.rows[0].uid_profile;
                  tHistoryApprove.rows[0].uid_object = tHistoryApprove.rows[0].uid_object ? `'${tHistoryApprove.rows[0].uid_object}'` : tHistoryApprove.rows[0].uid_object;
                  tHistoryApprove.rows[0].value = tHistoryApprove.rows[0].value ? `'${tHistoryApprove.rows[0].value}'` : tHistoryApprove.rows[0].value;
                  tHistoryApprove.rows[0].value_string = tHistoryApprove.rows[0].value_string ? `'${tHistoryApprove.rows[0].value_string}'` : tHistoryApprove.rows[0].value_string;
                  tHistoryApprove.rows[0].value_memo = tHistoryApprove.rows[0].value_memo ? `'${tHistoryApprove.rows[0].value_memo}'` : tHistoryApprove.rows[0].value_memo;
                  tHistoryApprove.rows[0].flag = tHistoryApprove.rows[0].flag ? `${tHistoryApprove.rows[0].flag}` : "-";

                  tHistoryApprove.rows[0].acc_date = `'${new Date(tHistoryApprove.rows[0].acc_date).toISOString()}'`;
                  tHistoryApprove.rows[0].created_at = `'${new Date(tHistoryApprove.rows[0].created_at).toISOString()}'`;
                  tHistoryApprove.rows[0].updated_at = `'${new Date(tHistoryApprove.rows[0].updated_at).toISOString()}'`;

                  examContent += "INSERT INTO t_history_approve (uid_examination, uid_test, value, value_string, is_acc, acc_date, uid_acc_by, flag, value_memo, enabled, uid_profile, uid_object, uid, created_at, updated_at, reason) VALUES(" + tHistoryApprove.rows[0].uid_examination + ", " + tHistoryApprove.rows[0].uid_test + ", " + tHistoryApprove.rows[0].value + ", " + tHistoryApprove.rows[0].value_string + ", " + tHistoryApprove.rows[0].is_acc + ", " + tHistoryApprove.rows[0].acc_date + ", " + tHistoryApprove.rows[0].uid_acc_by + ", '" + tHistoryApprove.rows[0].flag + "', " + tHistoryApprove.rows[0].value_memo + ", " + tHistoryApprove.rows[0].enabled + ", " + tHistoryApprove.rows[0].uid_profile + ", " + tHistoryApprove.rows[0].uid_object + ", " + tHistoryApprove.rows[0].uid + ", " + tHistoryApprove.rows[0].created_at + ", " + tHistoryApprove.rows[0].updated_at + ", " + tHistoryApprove.rows[0].reason + ");\n";
                }
                if (tHistoryVerify.rowCount > 0) {
                  tHistoryVerify.rows[0].uid_examination = tHistoryVerify.rows[0].uid_examination ? `'${tHistoryVerify.rows[0].uid_examination}'` : tHistoryVerify.rows[0].uid_examination;
                  tHistoryVerify.rows[0].uid = tHistoryVerify.rows[0].uid ? `'${tHistoryVerify.rows[0].uid}'` : tHistoryVerify.rows[0].uid;
                  tHistoryVerify.rows[0].uid_test = tHistoryVerify.rows[0].uid_test ? `'${tHistoryVerify.rows[0].uid_test}'` : tHistoryVerify.rows[0].uid_test;
                  tHistoryVerify.rows[0].uid_verify_by = tHistoryVerify.rows[0].uid_verify_by ? `'${tHistoryVerify.rows[0].uid_verify_by}'` : tHistoryVerify.rows[0].uid_verify_by;
                  tHistoryVerify.rows[0].uid_profile = tHistoryVerify.rows[0].uid_profile ? `'${tHistoryVerify.rows[0].uid_profile}'` : tHistoryVerify.rows[0].uid_profile;
                  tHistoryVerify.rows[0].uid_object = tHistoryVerify.rows[0].uid_object ? `'${tHistoryVerify.rows[0].uid_object}'` : tHistoryVerify.rows[0].uid_object;
                  tHistoryVerify.rows[0].value = tHistoryVerify.rows[0].value ? `'${tHistoryVerify.rows[0].value}'` : tHistoryVerify.rows[0].value;
                  tHistoryVerify.rows[0].value_memo = tHistoryVerify.rows[0].value_memo ? `'${tHistoryVerify.rows[0].value_memo}'` : tHistoryVerify.rows[0].value_memo;
                  tHistoryVerify.rows[0].value_string = tHistoryVerify.rows[0].value_string ? `'${tHistoryVerify.rows[0].value_string}'` : tHistoryVerify.rows[0].value_string;
                  tHistoryVerify.rows[0].flag = tHistoryVerify.rows[0].flag ? `'${tHistoryVerify.rows[0].flag}'` : tHistoryVerify.rows[0].flag;

                  tHistoryVerify.rows[0].verify_date = `'${new Date(tHistoryVerify.rows[0].verify_date).toISOString()}'`;
                  tHistoryVerify.rows[0].created_at = `'${new Date(tHistoryVerify.rows[0].created_at).toISOString()}'`;
                  tHistoryVerify.rows[0].updated_at = `'${new Date(tHistoryVerify.rows[0].updated_at).toISOString()}'`;
                  examContent += "INSERT INTO t_history_verify (uid_examination, uid_test, value, value_string, is_verify, verify_date, uid_verify_by, flag, value_memo, enabled, uid_profile, uid_object, uid, created_at, updated_at, reason) VALUES(" + tHistoryVerify.rows[0].uid_examination + ", " + tHistoryVerify.rows[0].uid_test + ", " + tHistoryVerify.rows[0].value + ", " + tHistoryVerify.rows[0].value_string + ", " + tHistoryVerify.rows[0].is_verify + ", " + tHistoryVerify.rows[0].verify_date + ", " + tHistoryVerify.rows[0].uid_verify_by + ", " + tHistoryVerify.rows[0].flag + ", " + tHistoryVerify.rows[0].value_memo + ", " + tHistoryVerify.rows[0].enabled + ", " + tHistoryVerify.rows[0].uid_profile + ", " + tHistoryVerify.rows[0].uid_object + ", " + tHistoryVerify.rows[0].uid + ", " + tHistoryVerify.rows[0].created_at + ", " + tHistoryVerify.rows[0].updated_at + ", " + tHistoryVerify.rows[0].reason + ");\n";
                }
                // console.log(examContent);
                return examContent;
              })
            );
            // console.log(contentTPE.includes("t_patient_examination_critical") ? contentTPE : "");
            // contentTPE = contentTPE.replace(",INSERT", "INSERT");
            contentTPE[0] = contentTPE[0] ? contentTPE[0] : "";
            let contentTCS = tCommentSample.rows.map((element) => {
              // console.log("ADA", contentTPR);
              if (!element) {
                return "";
              }

              element.created_at = `'${new Date(element.created_at).toISOString()}'`;
              element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;
              element.status_date = `'${new Date(element.status_date).toISOString()}'`;

              element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
              element.uid = element.uid ? `'${element.uid}'` : element.uid;
              element.uid_comment_by = element.uid_comment_by ? `'${element.uid_comment_by}'` : element.uid_comment_by;
              element.comment = element.comment ? `'${element.comment}'` : element.comment;
              element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
              element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;
              element.status_by = element.status_by ? `'${element.status_by}'` : element.status_by;

              return "INSERT INTO t_comment_sample (uid_registration, uid, comment, uid_comment_by, status, status_by, status_date, enabled, uid_profile, uid_object, created_at, updated_at) VALUES(" + element.uid_registration + ", " + element.uid + ", " + element.comment + ", " + element.uid_comment_by + ", " + element.status + ", " + element.status_by + ", " + element.status_date + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ");" + "\n";
            })[0];
            contentTCS = contentTCS ? contentTCS : "";

            let contentTPD = tPatientDiagnose.rows.map((element) => {
              if (!element) {
                return "";
              }

              element.created_at = `'${new Date(element.created_at).toISOString()}'`;
              element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;

              element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
              element.diagnose = element.diagnose ? `'${element.diagnose}'` : element.diagnose;
              element.icd10 = element.icd10 ? `'${element.icd10}'` : element.icd10;
              element.icd10_text = element.icd10_text ? `'${element.icd10_text}'` : element.icd10_text;
              element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
              element.uid = element.uid ? `'${element.uid}'` : element.uid;
              element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;
              element.status_by = element.status_by ? `'${element.status_by}'` : element.status_by;
              element.source = element.source ? `'${element.source}'` : element.source;

              return "INSERT INTO t_patient_diagnose (uid_registration, diagnose, icd10, icd10_text, uid, uid_profile, uid_object, created_at, updated_at, source,type) VALUES(" + element.uid_registration + ", " + element.diagnose + ", " + element.icd10 + ", " + element.icd10_text + ", " + element.uid + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ", " + element.source + ", " + element.type + ");" + "\n";
            })[0];
            contentTPD = contentTPD ? contentTPD : "";

            let contentTPEM = tPatientExamMicro.rows.map((element) => {
              if (!element) {
                return "";
              }

              element.taken_date = `'${new Date(element.taken_date).toISOString()}'`;
              element.verified_date = `'${new Date(element.verified_date).toISOString()}'`;
              // console.log("ada", contentTPR);
              // console.log(JSON.stringify(element.microscopic_value));
              element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
              element.microscopic_value = element.microscopic_value ? `'${JSON.stringify(element.microscopic_value)}'` : element.microscopic_value;
              element.bacteria_result = element.bacteria_result ? `'${JSON.stringify(element.bacteria_result)}'` : element.bacteria_result;
              element.antibiotic_test_result = element.antibiotic_test_result ? `'${JSON.stringify(element.antibiotic_test_result)}'` : element.antibiotic_test_result;
              element.uid_t_patient_exam = element.uid_t_patient_exam ? `'${element.uid_t_patient_exam}'` : element.uid_t_patient_exam;
              element.mrn = element.mrn ? `'${element.mrn}'` : element.mrn;
              element.uid_registration = element.uid_registration ? `${element.uid_registration}` : element.uid_registration;
              element.sample_num = element.sample_num ? `'${element.sample_num}'` : element.sample_num;
              element.taken_by = element.taken_by ? `'${element.taken_by}'` : element.taken_by;
              element.verified_by = element.verified_by ? `'${element.verified_by}'` : element.verified_by;
              element.approved_by = element.approved_by ? `'${element.approved_by}'` : element.approved_by;
              element.uid_test = element.uid_test ? `'${element.uid_test}'` : element.uid_test;
              element.keterangan = element.keterangan ? `'${element.keterangan}'` : element.keterangan;
              element.isEdited = element.isEdited ? `'${element.isEdited}'` : element.isEdited;
              element.jaringan = element.jaringan ? `'${element.jaringan}'` : element.jaringan;
              element.request_type = element.request_type ? `'${element.request_type}'` : element.request_type;
              element.speciment_type = element.speciment_type ? `'${element.speciment_type}'` : element.speciment_type;
              element.id = element.id ? `'${element.id}'` : element.id;
              // element.isVerify = element.isVerify ? `'${element.isVerify}'` : element.isVerify;
              element.additional = element.additional ? `'${JSON.stringify(element.additional)}'` : element.additional;

              return "INSERT INTO t_patient_exam_microbiology (id, microscopic_value, growth, bacteria_result, antibiotic_test_result, uid_t_patient_exam, mrn, uid_registration, sample_num, taken_date, taken_by, verified_date, verified_by, approved_date, approved_by, uid_test, keterangan, jaringan, request_type, speciment_type, additional) VALUES(" + element.id + ", " + element.microscopic_value + ", " + element.growth + ", " + element.bacteria_result + ", " + element.antibiotic_test_result + ", " + element.uid_t_patient_exam + ", " + element.mrn + ", " + element.uid_registration + ", " + element.sample_num + ", " + element.taken_date + ", " + element.taken_by + ", " + element.verified_date + ", " + element.verified_by + ", " + element.approved_date + ", " + element.approved_by + ", " + element.uid_test + ", " + element.keterangan + ", " + element.jaringan + ", " + element.request_type + ", " + element.speciment_type + ", " + element.additional + ");" + "\n";
            })[0];
            contentTPEM = contentTPEM ? contentTPEM : "";
            let contentTPP = tPatientPayment.rows.map((element) => {
              if (!element) {
                return "";
              }

              element.created_at = `'${new Date(element.created_at).toISOString()}'`;
              element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;
              element.payment_date = `'${new Date(element.payment_date).toISOString()}'`;

              element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
              element.amount_of_bill = element.amount_of_bill ? `'${element.amount_of_bill}'` : element.amount_of_bill;
              element.amount_of_claim = element.amount_of_claim ? `'${element.amount_of_claim}'` : element.amount_of_claim;
              element.amount_of_payment = element.amount_of_payment ? `'${element.amount_of_payment}'` : element.amount_of_payment;
              element.amount_of_discount = element.amount_of_discount ? `'${element.amount_of_discount}'` : element.amount_of_discount;
              element.amount_of_tax = element.amount_of_tax ? `'${element.amount_of_tax}'` : element.amount_of_tax;
              element.remaining_pay = element.remaining_pay ? `'${element.remaining_pay}'` : element.remaining_pay;
              element.uid_billing = element.uid_billing ? `'${element.uid_billing}'` : element.uid_billing;
              element.uid_claim = element.uid_claim ? `'${element.uid_claim}'` : element.uid_claim;
              element.uid_payment_method = element.uid_payment_method ? `'${element.uid_payment_method}'` : element.uid_payment_method;
              element.card_number = element.card_number ? `'${element.card_number}'` : element.card_number;
              element.uid = element.uid ? `'${element.uid}'` : element.uid;
              element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
              element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;
              element.uid_claim = element.uid_claim ? `'${element.uid_claim}'` : element.uid_claim;

              element.discount = element.discount ? `'${element.discount}'` : element.discount;
              element.tax = element.tax ? `'${element.tax}'` : element.tax;
              element.reg_num = element.reg_num ? `'${element.reg_num}'` : element.reg_num;
              element.mrn = element.mrn ? `'${element.mrn}'` : element.mrn;

              return "INSERT INTO t_patient_payment (mrn, uid_registration, reg_num, amount_of_bill, amount_of_claim, amount_of_payment, amount_of_discount, amount_of_tax, remaining_pay, uid_billing, uid_claim, payment_date, uid_payment_method, card_number, uid, uid_profile, uid_object, created_at, updated_at, is_bridge, discount, tax) VALUES(" + element.mrn + ", " + element.uid_registration + ", " + element.reg_num + ", " + element.amount_of_bill + ", " + element.amount_of_claim + ", " + element.amount_of_payment + ", " + element.amount_of_discount + ", " + element.amount_of_tax + ", " + element.remaining_pay + ", " + element.uid_billing + ", " + element.uid_claim + ", " + element.payment_date + ", " + element.uid_payment_method + ", " + element.card_number + ", " + element.uid + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ", " + element.is_bridge + ", " + element.discount + ", " + element.tax + ");" + "\n";
            })[0];
            contentTPP = contentTPP ? contentTPP : "";
            contentTPE = contentTPE.join("");
            let contentFull = contentEBR + "\n" + contentTPR + "\n" + contentTPO + "\n" + contentTPOD + "\n" + contentTPS + "\n" + contentTPSS + "\n" + contentTPE + "\n" + contentTCS + "\n" + contentTPD + "\n" + contentTPEM + "\n" + contentTPP;

            fs.writeFile(element.lno + ".sql", contentFull, (err) => {
              if (err) {
                console.error(err);
              } else {
              }
            });
          }
        }
        // return eBridgeReceive.rows[0];
      })
    );
    // client2.release(); // Release the client back to the pool
    res.json({ dev: [], prod: [] });
  } catch (error) {
    console.error("Error executing queries:", error);
    res.status(500).send("Internal Server Error", error);
  }
});
app.post("/manual", async (req, res) => {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const client1 = await pool1.connect();
    console.log("CONNECTED");
    const result1 = await client1.query("SELECT * FROM t_patient_registration WHERE created_at BETWEEN $1 AND $2", [startDate, endDate]);
    // client1.release(); // Release the client back to the pool

    const client2 = await pool2.connect();
    resultRecovery = await Promise.all(
      result1.rows.map(async (element) => {
        const tPatientRegistration = await client2.query("SELECT * FROM t_patient_registration WHERE reg_num='" + element.reg_num + "' LIMIT 1");
        let tPatientRegistrationItem = tPatientRegistration.rows[0];
        console.log(tPatientRegistration.rowCount);
        // insert e bridge receive
        element.created_at = new Date(element.created_at).toISOString();
        if (tPatientRegistration.rowCount === 0) {
          let tPatientOrderDetail = await client1.query("SELECT * FROM t_patient_order_detail WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
          let tPatientOrder = await client1.query("SELECT * FROM t_patient_order WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
          if (tPatientOrder.rowCount > 0) {
            let tPatientSample = await client1.query("SELECT * FROM t_patient_sample WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
            let tPatientSampleSpeciment = await client1.query("SELECT * FROM t_patient_sample_speciment WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
            let tPatientPayment = await client1.query("SELECT * FROM t_patient_payment WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");

            let tPatientExamination = await client1.query("SELECT * FROM t_patient_examination WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");

            let tCommentSample = await client1.query("SELECT * FROM t_comment_sample WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
            let tPatientDiagnose = await client1.query("SELECT * FROM t_patient_diagnose WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
            let tPatientExamMicro = await client1.query("SELECT * FROM t_patient_exam_microbiology WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");

            element.updated_at = new Date(element.updated_at).toISOString();
            element.release_date = new Date(element.release_date).toISOString();
            element.split_date = new Date(element.split_date).toISOString();
            let contentEBR = "INSERT INTO e_bridge_receive (ono, lno, text_result, text_order, release_date, validate, created_at, updated_at, split_date, source, result_message_id) VALUES('" + element.ono + "' ,'" + element.lno + "','" + element.text_result + "', '" + element.text_order + "' , '" + element.release_date + "','" + element.release_date + "','" + element.created_at + "','" + element.updated_at + "','" + element.split_date + "', '" + element.source + "', '" + element.result_message_id + "');";

            tPatientRegistrationItem.created_at = `'${new Date(tPatientRegistrationItem.created_at).toISOString()}'`;
            tPatientRegistrationItem.updated_at = `'${new Date(tPatientRegistrationItem.updated_at).toISOString()}'`;
            tPatientRegistrationItem.cancelation_date = `'${new Date(tPatientRegistrationItem.cancelation_date).toISOString()}'`;
            tPatientRegistrationItem.registration_date = `'${new Date(tPatientRegistrationItem.registration_date).toISOString()}'`;

            tPatientRegistrationItem.patient_type = !tPatientRegistrationItem.patient_type ? tPatientRegistrationItem.patient_type : `'${tPatientRegistrationItem.patient_type}'`;
            tPatientRegistrationItem.fast_note = tPatientRegistrationItem.fast_note ? `'${tPatientRegistrationItem.fast_note}'` : null;
            // tPatientRegistrationItem.fast_note = !tPatientRegistrationItem.fast_note ? tPatientRegistrationItem.fast_note : `'${tPatientRegistrationItem.fast_note}'`;
            tPatientRegistrationItem.mrn = !tPatientRegistrationItem.mrn ? tPatientRegistrationItem.mrn : `'${tPatientRegistrationItem.mrn}'`;
            tPatientRegistrationItem.guarantor = !tPatientRegistrationItem.guarantor ? tPatientRegistrationItem.guarantor : `'${tPatientRegistrationItem.guarantor}'`;
            tPatientRegistrationItem.members_number = !tPatientRegistrationItem.members_number ? tPatientRegistrationItem.members_number : `'${tPatientRegistrationItem.members_number}'`;
            tPatientRegistrationItem.referral_type = !tPatientRegistrationItem.referral_type ? tPatientRegistrationItem.referral_type : `'${tPatientRegistrationItem.referral_type}'`;
            tPatientRegistrationItem.uid_ward = !tPatientRegistrationItem.uid_ward ? tPatientRegistrationItem.uid_ward : `'${tPatientRegistrationItem.uid_ward}'`;
            tPatientRegistrationItem.uid_class = !tPatientRegistrationItem.uid_class ? tPatientRegistrationItem.uid_class : `'${tPatientRegistrationItem.uid_class}'`;
            tPatientRegistrationItem.uid_doctor_referral = !tPatientRegistrationItem.uid_doctor_referral ? tPatientRegistrationItem.uid_doctor_referral : `'${tPatientRegistrationItem.uid_doctor_referral}'`;
            tPatientRegistrationItem.reg_num = !tPatientRegistrationItem.reg_num ? tPatientRegistrationItem.reg_num : `'${tPatientRegistrationItem.reg_num}'`;
            tPatientRegistrationItem.created_by = !tPatientRegistrationItem.created_by ? tPatientRegistrationItem.created_by : `'${tPatientRegistrationItem.created_by}'`;
            tPatientRegistrationItem.uid_updated_by = tPatientRegistrationItem.uid_updated_by = !tPatientRegistrationItem.uid_updated_by ? tPatientRegistrationItem.uid_updated_by : `'${tPatientRegistrationItem.uid_updated_by}'`;
            tPatientRegistrationItem.uid = !tPatientRegistrationItem.uid ? tPatientRegistrationItem.uid : `'${tPatientRegistrationItem.uid}'`;
            tPatientRegistrationItem.uid_profile = !tPatientRegistrationItem.uid_profile ? tPatientRegistrationItem.uid_profile : `'${tPatientRegistrationItem.uid_profile}'`;
            tPatientRegistrationItem.uid_object = !tPatientRegistrationItem.uid_object ? tPatientRegistrationItem.uid_object : `'${tPatientRegistrationItem.uid_object}'`;
            tPatientRegistrationItem.room_number = !tPatientRegistrationItem.room_number ? tPatientRegistrationItem.room_number : `'${tPatientRegistrationItem.room_number}'`;
            tPatientRegistrationItem.source = !tPatientRegistrationItem.source ? tPatientRegistrationItem.source : `'${tPatientRegistrationItem.source}'`;
            tPatientRegistrationItem.no_reg = !tPatientRegistrationItem.no_reg ? tPatientRegistrationItem.no_reg : `'${tPatientRegistrationItem.no_reg}'`;
            tPatientRegistrationItem.sign_fast = !tPatientRegistrationItem.sign_fast ? tPatientRegistrationItem.sign_fast : `'${tPatientRegistrationItem.sign_fast}'`;
            tPatientRegistrationItem.fast_note = !tPatientRegistrationItem.fast_note ? tPatientRegistrationItem.fast_note : `'${tPatientRegistrationItem.fast_note}'`;
            tPatientRegistrationItem.uid_doctor_incharge = !tPatientRegistrationItem.uid_doctor_incharge ? tPatientRegistrationItem.uid_doctor_incharge : `'${tPatientRegistrationItem.uid_doctor_incharge}'`;
            tPatientRegistrationItem.uid_facility_referral = !tPatientRegistrationItem.uid_facility_referral ? tPatientRegistrationItem.uid_facility_referral : `'${tPatientRegistrationItem.uid_facility_referral}'`;
            tPatientRegistrationItem.uid_doctor = !tPatientRegistrationItem.uid_doctor ? tPatientRegistrationItem.uid_doctor : `'${tPatientRegistrationItem.uid_doctor}'`;
            let contentTPR = "INSERT INTO t_patient_registration (mrn, patient_type, guarantor, members_number, referral_type, uid_ward, uid_class, uid_doctor_referral, uid_facility_referral, uid_doctor, is_cyto, reg_num, registration_date,created_by, uid_updated_by, uid, enabled, uid_profile, uid_object, created_at, updated_at, cancelation_remark, cancelation_date, is_bridge, room_number, source, no_reg, sign_fast, fast_note, is_pregnant, is_mcu, uid_doctor_incharge) VALUES(" + tPatientRegistrationItem.mrn + " ," + tPatientRegistrationItem.patient_type + "," + tPatientRegistrationItem.guarantor + ", " + tPatientRegistrationItem.members_number + " , " + tPatientRegistrationItem.referral_type + ", " + tPatientRegistrationItem.uid_ward + ", " + tPatientRegistrationItem.uid_class + ", " + tPatientRegistrationItem.uid_doctor_referral + ", " + tPatientRegistrationItem.uid_facility_referral + ", " + tPatientRegistrationItem.uid_doctor + ", " + tPatientRegistrationItem.is_cyto + ", " + tPatientRegistrationItem.reg_num + ", " + tPatientRegistrationItem.registration_date + ", " + tPatientRegistrationItem.created_by + ", " + tPatientRegistrationItem.uid_updated_by + ", " + tPatientRegistrationItem.uid + ", " + tPatientRegistrationItem.enabled + ", " + tPatientRegistrationItem.uid_profile + ", " + tPatientRegistrationItem.uid_object + ", " + tPatientRegistrationItem.created_at + ", " + tPatientRegistrationItem.updated_at + ", " + tPatientRegistrationItem.cancelation_remark + ", " + tPatientRegistrationItem.cancelation_date + ", " + tPatientRegistrationItem.is_bridge + ", " + tPatientRegistrationItem.room_number + ", " + tPatientRegistrationItem.source + ", " + tPatientRegistrationItem.no_reg + ", " + tPatientRegistrationItem.sign_fast + ", " + tPatientRegistrationItem.fast_note + ", " + tPatientRegistrationItem.is_pregnant + ", " + tPatientRegistrationItem.is_mcu + ", " + tPatientRegistrationItem.uid_doctor_incharge + ");";

            // t patient order
            let contentTPO = tPatientOrder.rows.map((element) => {
              if (!element) {
                return "";
              }

              // element.created_at = element.created_at = new Date(element.created_at).toISOString();
              // element.updated_at = element.updated_at = new Date(element.updated_at).toISOString();
              // element.mrn = !element.mrn ? element.mrn : element.mrn;
              // element.uid_registration = !element.uid_registration ? element.uid_registration : element.uid_registration;
              // element.uid_test = !element.uid_test ? element.uid_test : element.uid_test;
              // element.id_type_test = !element.id_type_test ? element.id_type_test : element.id_type_test;
              // element.quantity = !element.quantity ? element.quantity : element.quantity;
              // element.uid_created_by = !element.uid_created_by ? element.uid_created_by : element.uid_created_by;
              // element.uid_updated_by = !element.uid_updated_by ? element.uid_updated_by : element.uid_updated_by;
              // element.uid = !element.uid ? element.uid : element.uid;
              // element.uid_profile = !element.uid_profile ? element.uid_profile : element.uid_profile;
              // element.uid_object = !element.uid_object ? element.uid_object : element.uid_object;
              // element.created_at = !element.created_at ? element.created_at : element.created_at;
              // element.updated_at = !element.updated_at ? element.updated_at : element.updated_at;

              element.created_at = element.created_at ? `${new Date(element.created_at).toISOString()}` : element.created_at;
              element.updated_at = element.updated_at ? `${new Date(element.updated_at).toISOString()}` : element.updated_at;
              element.mrn = element.mrn ? `'${element.mrn}'` : element.mrn;
              element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
              element.uid_test = element.uid_test ? `'${element.uid_test}'` : element.uid_test;
              element.id_type_test = element.id_type_test ? `'${element.id_type_test}'` : element.id_type_test;
              element.quantity = element.quantity ? `'${element.quantity}'` : element.quantity;
              element.uid_created_by = element.uid_created_by ? `'${element.uid_created_by}'` : element.uid_created_by;
              element.uid_updated_by = element.uid_updated_by ? `'${element.uid_updated_by}'` : element.uid_updated_by;
              element.uid = element.uid ? `'${element.uid}'` : element.uid;
              element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
              element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;
              element.created_at = element.created_at ? `'${element.created_at}'` : element.created_at;
              element.updated_at = element.updated_at ? `'${element.updated_at}'` : element.updated_at;

              return "INSERT INTO t_patient_order (mrn, uid_registration, uid_test, id_type_test, quantity, uid_created_by, uid_updated_by, enabled, uid, uid_profile, uid_object, created_at, updated_at, is_bridge) VALUES(" + element.mrn + ", " + element.uid_registration + ", " + element.uid_test + ", " + element.id_type_test + ", " + element.quantity + ", " + element.uid_created_by + ", " + element.uid_updated_by + ", " + element.enabled + ", " + element.uid + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ", " + element.is_bridge + ");" + "\n";
            })[0];

            let contentTPOD = tPatientOrderDetail.rows.map((element) => {
              if (!element) {
                return "";
              }

              element.created_at = `'${new Date(element.created_at).toISOString()}'`;
              element.acc_date = `'${new Date(element.acc_date).toISOString()}'`;
              element.verify_date = `'${new Date(element.verify_date).toISOString()}'`;
              element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;

              element.mrn = !element.mrn ? element.mrn : `'${element.mrn}'`;
              element.value = !element.value ? element.value : `'${element.value}'`;
              element.value_string = !element.value_string ? element.value_string : `'${element.value_string}'`;
              element.value_memo = !element.value_memo ? element.value_memo : `'${element.value_memo}'`;
              element.uid_verify_by = !element.uid_verify_by ? element.uid_verify_by : `'${element.uid_verify_by}'`;
              element.uid_instrument = !element.uid_instrument ? element.uid_instrument : `'${element.uid_instrument}'`;
              element.uid_acc_by = !element.uid_acc_by ? element.uid_acc_by : `'${element.uid_acc_by}'`;
              element.uid_action_by = !element.uid_action_by ? element.uid_action_by : `'${element.uid_action_by}'`;
              element.uid_profile = !element.uid_profile ? element.uid_profile : `'${element.uid_profile}'`;
              element.uid_object = !element.uid_object ? element.uid_object : `'${element.uid_object}'`;
              element.uid = !element.uid ? element.uid : `'${element.uid}'`;
              element.flag = !element.flag ? element.flag : `'${element.flag}'`;
              element.uid_nilai_normal = !element.uid_nilai_normal ? element.uid_nilai_normal : `'${element.uid_nilai_normal}'`;
              element.uid_package = !element.uid_package ? element.uid_package : `'${element.uid_package}'`;
              element.uid_panel = !element.uid_panel ? element.uid_panel : `'${element.uid_panel}'`;
              element.uid_parent = !element.uid_parent ? element.uid_parent : `'${element.uid_parent}'`;
              element.uid_registration = !element.uid_registration ? element.uid_registration : `'${element.uid_registration}'`;
              element.uid_test = !element.uid_test ? element.uid_test : `'${element.uid_test}'`;

              return "INSERT INTO t_patient_order_detail (mrn, uid_registration, uid_test, value, value_string, value_memo, is_verify, verify_date, uid_verify_by, uid_instrument, is_acc, acc_date, is_edit, uid_acc_by, uid_action_by, enabled, uid_profile, uid_object, uid, flag, uid_nilai_normal, uid_package, uid_panel, uid_parent, created_at, updated_at, approve_mobile, id_order) VALUES(" + element.mrn + ", " + element.uid_registration + ", " + element.uid_test + ", " + element.value + " , " + element.value_string + ", " + element.value_memo + ", " + element.is_verify + ", " + element.verify_date + ", " + element.uid_verify_by + ", " + element.uid_instrument + ", " + element.is_acc + ", " + element.acc_date + ", " + element.is_edit + ", " + element.uid_acc_by + ", " + element.uid_action_by + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.uid + ", " + element.flag + ", " + element.uid_nilai_normal + ", " + element.uid_package + ", " + element.uid_panel + ", " + element.uid_parent + ", " + element.created_at + ", " + element.updated_at + ", " + element.approve_mobile + ", " + element.id_order + ");" + "\n";
            })[0];

            let contentTPS = tPatientSample.rows.map((element) => {
              if (!element) {
                return "";
              }

              element.created_at = `'${new Date(element.created_at).toISOString()}'`;
              element.taken_date = `'${new Date(element.taken_date).toISOString()}'`;
              element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;

              element.sample_num = !element.sample_num ? element.sample_num : `'${element.sample_num}'`;
              element.mrn = !element.mrn ? element.mrn : `'${element.mrn}'`;
              element.uid_registration = !element.uid_registration ? element.uid_registration : `'${element.uid_registration}'`;
              element.uid_test = !element.uid_test ? element.uid_test : `'${element.uid_test}'`;
              element.taken_date = !element.taken_date ? element.taken_date : `${element.taken_date}`;
              element.type_ref = !element.type_ref ? element.type_ref : `'${element.type_ref}'`;
              element.qty_print = !element.qty_print ? element.qty_print : `'${element.qty_print}'`;
              element.uid_paket = !element.uid_paket ? element.uid_paket : `'${element.uid_paket}'`;
              element.uid_panel = !element.uid_panel ? element.uid_panel : `'${element.uid_panel}'`;
              element.uid = !element.uid ? element.uid : `'${element.uid}'`;
              element.uid_profile = !element.uid_profile ? element.uid_profile : `'${element.uid_profile}'`;
              element.uid_object = !element.uid_object ? element.uid_object : `'${element.uid_object}'`;
              element.uid_by = !element.uid_by ? element.uid_by : `'${element.uid_by}'`;
              element.read_by = !element.read_by ? element.read_by : `'${element.read_by}'`;

              return "INSERT INTO t_patient_sample (sample_num, mrn, uid_registration, uid_test, taken_date, type_ref, qty_print, uid_paket, uid_panel, uid, enabled, uid_profile, uid_object, created_at, updated_at, uid_by, is_read, read_by) VALUES(" + element.sample_num + ", " + element.mrn + ", " + element.uid_registration + ", " + element.uid_test + ", " + element.taken_date + ", " + element.type_ref + ", " + element.qty_print + ", " + element.uid_paket + ", " + element.uid_panel + ", " + element.uid + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ", " + element.uid_by + ", " + element.is_read + ", " + element.read_by + ");" + "\n";
            })[0];
            contentTPS = contentTPS ? contentTPS : "";
            let contentTPSS = tPatientSampleSpeciment.rows.map((element) => {
              if (!element) {
                return "";
              }

              element.created_at = `'${new Date(element.created_at).toISOString()}'`;
              element.taken_date = `'${new Date(element.taken_date).toISOString()}'`;
              element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;

              element.specimen = element.specimen ? `'${element.specimen}'` : element.specimen;
              element.reg_num = element.reg_num ? `'${element.reg_num}'` : element.reg_num;
              element.mrn = element.mrn ? `'${element.mrn}'` : element.mrn;
              element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
              element.uid_test = element.uid_test ? `'${element.uid_test}'` : element.uid_test;
              element.taken_date = element.taken_date ? `${element.taken_date}` : element.taken_date;
              element.uid_paket = element.uid_paket ? `'${element.uid_paket}'` : element.uid_paket;
              element.uid_panel = element.uid_panel ? `'${element.uid_panel}'` : element.uid_panel;
              element.uid = element.uid ? `'${element.uid}'` : element.uid;
              element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
              element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;

              return "INSERT INTO t_patient_sample_speciment (reg_num, mrn, specimen, uid_registration, uid_test, taken_date, qty_print, uid_paket, uid_panel, uid, enabled, uid_profile, uid_object, created_at, updated_at) VALUES(" + element.reg_num + ", " + element.mrn + ", " + element.specimen + ", " + element.uid_registration + ", " + element.uid_test + ", " + element.taken_date + ", " + element.qty_print + ", " + element.uid_paket + ", " + element.uid_panel + ", " + element.uid + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ");" + "\n";
            })[0];
            contentTPSS = contentTPSS ? contentTPSS : "";

            let contentTPE = await Promise.all(
              tPatientExamination.rows.map(async (element) => {
                // if (!element) {
                //   return "";
                // }

                let tCommentTest = await client1.query("SELECT * FROM t_comment_test WHERE uid_examination='" + element.uid + "'");
                let tHistoryApprove = await client1.query("SELECT * FROM t_history_approve WHERE uid_examination='" + element.uid + "'");
                let tHistoryVerify = await client1.query("SELECT * FROM t_history_verify WHERE uid_examination='" + element.uid + "'");
                let tPatientExaminationCritical = await client1.query("SELECT * FROM t_patient_examination_critical WHERE uid_patient_exam='" + element.uid + "'");

                element.created_at = `'${new Date(element.created_at).toISOString()}'`;
                element.pending_date = `'${new Date(element.pending_date).toISOString()}'`;
                element.acc_date = `'${new Date(element.acc_date).toISOString()}'`;
                element.verify_date = `'${new Date(element.verify_date).toISOString()}'`;
                element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;

                element.mrn = element.mrn ? `'${element.mrn}'` : element.mrn;
                element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
                element.uid_test = element.uid_test ? `'${element.uid_test}'` : element.uid_test;
                element.value = element.value ? `'${element.value}'` : element.value;
                element.value_string = element.value_string ? `'${element.value_string}'` : element.value_string;
                element.value_memo = element.value_memo ? `'${element.value_memo}'` : element.value_memo;
                element.uid_verify_by = element.uid_verify_by ? `'${element.uid_verify_by}'` : element.uid_verify_by;
                element.uid_instrument = element.uid_instrument ? `'${element.uid_instrument}'` : element.uid_instrument;
                element.uid_acc_by = element.uid_acc_by ? `'${element.uid_acc_by}'` : element.uid_acc_by;
                element.uid_created_by = element.uid_created_by ? `'${element.uid_created_by}'` : element.uid_created_by;
                element.uid_action_by = element.uid_action_by ? `'${element.uid_action_by}'` : element.uid_action_by;
                element.pending_by = element.pending_by ? `'${element.pending_by}'` : element.pending_by;
                element.uid = element.uid ? `'${element.uid}'` : element.uid;
                element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
                element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;
                element.uid_rolebase = element.uid_rolebase ? `'${element.uid_rolebase}'` : element.uid_rolebase;
                element.uid_panel = element.uid_panel ? `'${element.uid_panel}'` : element.uid_panel;
                element.flag = element.flag ? `'${element.flag}'` : element.flag;
                element.uid_parent = element.uid_parent ? `'${element.uid_parent}'` : element.uid_parent;
                element.uid_nilai_normal = element.uid_nilai_normal ? `'${element.uid_nilai_normal}'` : element.uid_nilai_normal;

                examContent = "INSERT INTO t_patient_examination (mrn, uid_registration, uid_test, value, value_string, value_memo, is_verify, verify_date, print_date, uid_verify_by, uid_instrument, is_acc, acc_date, is_edit, flag, pending_date, pending_by, uid_acc_by, uid_created_by, uid_action_by, uid_package, uid_panel, uid_parent, uid_nilai_normal, uid, enabled, uid_profile, uid_object, created_at, updated_at, approve_mobile, uid_rolebase, role_text, sign, id_order, is_duplo) VALUES(" + element.mrn + ", " + element.uid_registration + ", " + element.uid_test + ", " + element.value + ", " + element.value_string + ", " + element.value_memo + ", " + element.is_verify + ", " + element.verify_date + ", " + element.print_date + ", " + element.uid_verify_by + ", " + element.uid_instrument + ", " + element.is_acc + ", " + element.acc_date + ", " + element.is_edit + ", " + element.flag + ", " + element.pending_date + ", " + element.pending_by + ", " + element.uid_acc_by + ", " + element.uid_created_by + ", " + element.uid_action_by + ", " + element.uid_package + ", " + element.uid_panel + ", " + element.uid_parent + ", " + element.uid_nilai_normal + ", " + element.uid + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + "," + element.created_at + ", " + element.updated_at + ", " + element.approve_mobile + ", " + element.uid_rolebase + "," + element.role_text + "," + element.sign + ", " + element.id_order + "," + element.is_duplo + ");\n";

                if (tPatientExaminationCritical.rowCount > 0) {
                  tPatientExaminationCritical.rows[0].remark = tPatientExaminationCritical.rows[0].remark ? `'${tPatientExaminationCritical.rows[0].remark}'` : tPatientExaminationCritical.rows[0].remark;
                  tPatientExaminationCritical.rows[0].uid_user_by = tPatientExaminationCritical.rows[0].uid_user_by ? `'${tPatientExaminationCritical.rows[0].uid_user_by}'` : tPatientExaminationCritical.rows[0].uid_user_by;
                  tPatientExaminationCritical.rows[0].uid_user_to = tPatientExaminationCritical.rows[0].uid_user_to ? `'${tPatientExaminationCritical.rows[0].uid_user_to}'` : tPatientExaminationCritical.rows[0].uid_user_to;
                  tPatientExaminationCritical.rows[0].uid = tPatientExaminationCritical.rows[0].uid ? `'${tPatientExaminationCritical.rows[0].uid}'` : tPatientExaminationCritical.rows[0].uid;
                  tPatientExaminationCritical.rows[0].uid_profile = tPatientExaminationCritical.rows[0].uid_profile ? `'${tPatientExaminationCritical.rows[0].uid_profile}'` : tPatientExaminationCritical.rows[0].uid_profile;
                  tPatientExaminationCritical.rows[0].uid_object = tPatientExaminationCritical.rows[0].uid_object ? `'${tPatientExaminationCritical.rows[0].uid_object}'` : tPatientExaminationCritical.rows[0].uid_object;
                  tPatientExaminationCritical.rows[0].uid = tPatientExaminationCritical.rows[0].uid ? `${tPatientExaminationCritical.rows[0].uid}` : tPatientExaminationCritical.rows[0].uid;
                  tPatientExaminationCritical.rows[0].created_at = tPatientExaminationCritical.rows[0].created_at ? `'${new Date(tPatientExaminationCritical.rows[0].created_at).toISOString()}'` : tPatientExaminationCritical.rows[0].created_at;
                  tPatientExaminationCritical.rows[0].updated_at = tPatientExaminationCritical.rows[0].updated_at ? `'${new Date(tPatientExaminationCritical.rows[0].updated_at).toISOString()}'` : tPatientExaminationCritical.rows[0].updated_at;
                  tPatientExaminationCritical.rows[0].uid_patient_exam = tPatientExaminationCritical.rows[0].uid_patient_exam ? `'${tPatientExaminationCritical.rows[0].uid_patient_exam}'` : tPatientExaminationCritical.rows[0].uid_patient_exam;
                  tPatientExaminationCritical.rows[0].confirm_date = tPatientExaminationCritical.rows[0].confirm_date ? `'${new Date(tPatientExaminationCritical.rows[0].confirm_date).toISOString()}'` : tPatientExaminationCritical.rows[0].confirm_date;
                  // tPatientExaminationCritical.rows[0].confirm_date = new Date(tPatientExaminationCritical.rows[0].confirm_date).toISOString();

                  examContent += "INSERT INTO t_patient_examination_critical (uid_patient_exam, remark, uid_user_by, uid_user_to, uid, enabled, uid_profile, uid_object,  created_at, updated_at, confirm_date, confirm_user) VALUES(" + tPatientExaminationCritical.rows[0].uid_patient_exam + ", " + tPatientExaminationCritical.rows[0].remark + ", " + tPatientExaminationCritical.rows[0].uid_user_by + ", " + tPatientExaminationCritical.rows[0].uid_user_to + ", " + tPatientExaminationCritical.rows[0].uid + ", " + tPatientExaminationCritical.rows[0].uid_profile + ", " + tPatientExaminationCritical.rows[0].uid_object + ", " + tPatientExaminationCritical.rows[0].created_at + ", " + tPatientExaminationCritical.rows[0].uid_object + ", " + tPatientExaminationCritical.rows[0].created_at + ", " + tPatientExaminationCritical.rows[0].updated_at + ", " + tPatientExaminationCritical.rows[0].confirm_date + ", " + tPatientExaminationCritical.rows[0].confirm_user + ");\n";
                }

                if (tCommentTest.rowCount > 0) {
                  tCommentTest.rows[0].uid_examination = tCommentTest.rows[0].uid_examination ? `'${tCommentTest.rows[0].uid_examination}'` : tCommentTest.rows[0].uid_examination;
                  tCommentTest.rows[0].uid = tCommentTest.rows[0].uid ? `'${tCommentTest.rows[0].uid}'` : tCommentTest.rows[0].uid;
                  tCommentTest.rows[0].status_by = tCommentTest.rows[0].status_by ? `'${tCommentTest.rows[0].status_by}'` : tCommentTest.rows[0].status_by;
                  // tCommentTest.rows[0].status = tCommentTest.rows[0].status ? `'${tCommentTest.rows[0].status}'` : tCommentTest.rows[0].status;
                  tCommentTest.rows[0].uid_comment_by = tCommentTest.rows[0].uid_comment_by ? `'${tCommentTest.rows[0].uid_comment_by}'` : tCommentTest.rows[0].uid_comment_by;
                  tCommentTest.rows[0].uid_profile = tCommentTest.rows[0].uid_profile ? `'${tCommentTest.rows[0].uid_profile}'` : tCommentTest.rows[0].uid_profile;
                  tCommentTest.rows[0].uid_object = tCommentTest.rows[0].uid_object ? `'${tCommentTest.rows[0].uid_object}'` : tCommentTest.rows[0].uid_object;
                  tCommentTest.rows[0].comment = tCommentTest.rows[0].comment ? `'${tCommentTest.rows[0].comment}'` : null;
                  tCommentTest.rows[0].uid_comment_by = tCommentTest.rows[0].uid_comment_by ? `${tCommentTest.rows[0].uid_comment_by}` : tCommentTest.rows[0].uid_comment_by;
                  tCommentTest.rows[0].created_at = tCommentTest.rows[0].created_at ? `'${new Date(tCommentTest.rows[0].created_at).toISOString()}'` : tCommentTest.rows[0].created_at;
                  tCommentTest.rows[0].updated_at = tCommentTest.rows[0].updated_at ? `'${new Date(tCommentTest.rows[0].updated_at).toISOString()}'` : tCommentTest.rows[0].updated_at;

                  examContent += "INSERT INTO t_comment_test (uid_examination, uid, comment, uid_comment_by, status, status_by, status_date, enabled, uid_profile, uid_object, created_at, updated_at) VALUES(" + tCommentTest.rows[0].uid_examination + ", " + tCommentTest.rows[0].uid + ", " + tCommentTest.rows[0].comment + ", " + tCommentTest.rows[0].uid_comment_by + "," + tCommentTest.rows[0].status + ", " + tCommentTest.rows[0].status_by + ", " + tCommentTest.rows[0].status_date + ", " + tCommentTest.rows[0].enabled + ", " + tCommentTest.rows[0].uid_profile + ", " + tCommentTest.rows[0].uid_object + ", " + tCommentTest.rows[0].created_at + ", " + tCommentTest.rows[0].updated_at + ");\n";
                }

                if (tHistoryApprove.rowCount > 0) {
                  tHistoryApprove.rows[0].uid_examination = tHistoryApprove.rows[0].uid_examination ? `'${tHistoryApprove.rows[0].uid_examination}'` : tHistoryApprove.rows[0].uid_examination;
                  tHistoryApprove.rows[0].uid = tHistoryApprove.rows[0].uid ? `'${tHistoryApprove.rows[0].uid}'` : tHistoryApprove.rows[0].uid;
                  tHistoryApprove.rows[0].uid_test = tHistoryApprove.rows[0].uid_test ? `'${tHistoryApprove.rows[0].uid_test}'` : tHistoryApprove.rows[0].uid_test;
                  tHistoryApprove.rows[0].uid_acc_by = tHistoryApprove.rows[0].uid_acc_by ? `'${tHistoryApprove.rows[0].uid_acc_by}'` : tHistoryApprove.rows[0].uid_acc_by;
                  tHistoryApprove.rows[0].uid_profile = tHistoryApprove.rows[0].uid_profile ? `'${tHistoryApprove.rows[0].uid_profile}'` : tHistoryApprove.rows[0].uid_profile;
                  tHistoryApprove.rows[0].uid_object = tHistoryApprove.rows[0].uid_object ? `'${tHistoryApprove.rows[0].uid_object}'` : tHistoryApprove.rows[0].uid_object;
                  tHistoryApprove.rows[0].value = tHistoryApprove.rows[0].value ? `'${tHistoryApprove.rows[0].value}'` : tHistoryApprove.rows[0].value;
                  tHistoryApprove.rows[0].value_string = tHistoryApprove.rows[0].value_string ? `'${tHistoryApprove.rows[0].value_string}'` : tHistoryApprove.rows[0].value_string;
                  tHistoryApprove.rows[0].value_memo = tHistoryApprove.rows[0].value_memo ? `'${tHistoryApprove.rows[0].value_memo}'` : tHistoryApprove.rows[0].value_memo;
                  tHistoryApprove.rows[0].flag = tHistoryApprove.rows[0].flag ? `${tHistoryApprove.rows[0].flag}` : "-";

                  tHistoryApprove.rows[0].acc_date = `'${new Date(tHistoryApprove.rows[0].acc_date).toISOString()}'`;
                  tHistoryApprove.rows[0].created_at = `'${new Date(tHistoryApprove.rows[0].created_at).toISOString()}'`;
                  tHistoryApprove.rows[0].updated_at = `'${new Date(tHistoryApprove.rows[0].updated_at).toISOString()}'`;

                  examContent += "INSERT INTO t_history_approve (uid_examination, uid_test, value, value_string, is_acc, acc_date, uid_acc_by, flag, value_memo, enabled, uid_profile, uid_object, uid, created_at, updated_at, reason) VALUES(" + tHistoryApprove.rows[0].uid_examination + ", " + tHistoryApprove.rows[0].uid_test + ", " + tHistoryApprove.rows[0].value + ", " + tHistoryApprove.rows[0].value_string + ", " + tHistoryApprove.rows[0].is_acc + ", " + tHistoryApprove.rows[0].acc_date + ", " + tHistoryApprove.rows[0].uid_acc_by + ", '" + tHistoryApprove.rows[0].flag + "', " + tHistoryApprove.rows[0].value_memo + ", " + tHistoryApprove.rows[0].enabled + ", " + tHistoryApprove.rows[0].uid_profile + ", " + tHistoryApprove.rows[0].uid_object + ", " + tHistoryApprove.rows[0].uid + ", " + tHistoryApprove.rows[0].created_at + ", " + tHistoryApprove.rows[0].updated_at + ", " + tHistoryApprove.rows[0].reason + ");\n";
                }
                if (tHistoryVerify.rowCount > 0) {
                  tHistoryVerify.rows[0].uid_examination = tHistoryVerify.rows[0].uid_examination ? `'${tHistoryVerify.rows[0].uid_examination}'` : tHistoryVerify.rows[0].uid_examination;
                  tHistoryVerify.rows[0].uid = tHistoryVerify.rows[0].uid ? `'${tHistoryVerify.rows[0].uid}'` : tHistoryVerify.rows[0].uid;
                  tHistoryVerify.rows[0].uid_test = tHistoryVerify.rows[0].uid_test ? `'${tHistoryVerify.rows[0].uid_test}'` : tHistoryVerify.rows[0].uid_test;
                  tHistoryVerify.rows[0].uid_verify_by = tHistoryVerify.rows[0].uid_verify_by ? `'${tHistoryVerify.rows[0].uid_verify_by}'` : tHistoryVerify.rows[0].uid_verify_by;
                  tHistoryVerify.rows[0].uid_profile = tHistoryVerify.rows[0].uid_profile ? `'${tHistoryVerify.rows[0].uid_profile}'` : tHistoryVerify.rows[0].uid_profile;
                  tHistoryVerify.rows[0].uid_object = tHistoryVerify.rows[0].uid_object ? `'${tHistoryVerify.rows[0].uid_object}'` : tHistoryVerify.rows[0].uid_object;
                  tHistoryVerify.rows[0].value = tHistoryVerify.rows[0].value ? `'${tHistoryVerify.rows[0].value}'` : tHistoryVerify.rows[0].value;
                  tHistoryVerify.rows[0].value_memo = tHistoryVerify.rows[0].value_memo ? `'${tHistoryVerify.rows[0].value_memo}'` : tHistoryVerify.rows[0].value_memo;
                  tHistoryVerify.rows[0].value_string = tHistoryVerify.rows[0].value_string ? `'${tHistoryVerify.rows[0].value_string}'` : tHistoryVerify.rows[0].value_string;
                  tHistoryVerify.rows[0].flag = tHistoryVerify.rows[0].flag ? `'${tHistoryVerify.rows[0].flag}'` : tHistoryVerify.rows[0].flag;

                  tHistoryVerify.rows[0].verify_date = `'${new Date(tHistoryVerify.rows[0].verify_date).toISOString()}'`;
                  tHistoryVerify.rows[0].created_at = `'${new Date(tHistoryVerify.rows[0].created_at).toISOString()}'`;
                  tHistoryVerify.rows[0].updated_at = `'${new Date(tHistoryVerify.rows[0].updated_at).toISOString()}'`;
                  examContent += "INSERT INTO t_history_verify (uid_examination, uid_test, value, value_string, is_verify, verify_date, uid_verify_by, flag, value_memo, enabled, uid_profile, uid_object, uid, created_at, updated_at, reason) VALUES(" + tHistoryVerify.rows[0].uid_examination + ", " + tHistoryVerify.rows[0].uid_test + ", " + tHistoryVerify.rows[0].value + ", " + tHistoryVerify.rows[0].value_string + ", " + tHistoryVerify.rows[0].is_verify + ", " + tHistoryVerify.rows[0].verify_date + ", " + tHistoryVerify.rows[0].uid_verify_by + ", " + tHistoryVerify.rows[0].flag + ", " + tHistoryVerify.rows[0].value_memo + ", " + tHistoryVerify.rows[0].enabled + ", " + tHistoryVerify.rows[0].uid_profile + ", " + tHistoryVerify.rows[0].uid_object + ", " + tHistoryVerify.rows[0].uid + ", " + tHistoryVerify.rows[0].created_at + ", " + tHistoryVerify.rows[0].updated_at + ", " + tHistoryVerify.rows[0].reason + ");\n";
                }
                // console.log(examContent);
                return examContent;
              })
            );
            // console.log(contentTPE.includes("t_patient_examination_critical") ? contentTPE : "");
            // contentTPE = contentTPE.replace(",INSERT", "INSERT");
            contentTPE[0] = contentTPE[0] ? contentTPE[0] : "";
            let contentTCS = tCommentSample.rows.map((element) => {
              // console.log("ADA", contentTPR);
              if (!element) {
                return "";
              }

              element.created_at = `'${new Date(element.created_at).toISOString()}'`;
              element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;
              element.status_date = `'${new Date(element.status_date).toISOString()}'`;

              element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
              element.uid = element.uid ? `'${element.uid}'` : element.uid;
              element.uid_comment_by = element.uid_comment_by ? `'${element.uid_comment_by}'` : element.uid_comment_by;
              element.comment = element.comment ? `'${element.comment}'` : element.comment;
              element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
              element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;
              element.status_by = element.status_by ? `'${element.status_by}'` : element.status_by;

              return "INSERT INTO t_comment_sample (uid_registration, uid, comment, uid_comment_by, status, status_by, status_date, enabled, uid_profile, uid_object, created_at, updated_at) VALUES(" + element.uid_registration + ", " + element.uid + ", " + element.comment + ", " + element.uid_comment_by + ", " + element.status + ", " + element.status_by + ", " + element.status_date + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ");" + "\n";
            })[0];
            contentTCS = contentTCS ? contentTCS : "";

            let contentTPD = tPatientDiagnose.rows.map((element) => {
              if (!element) {
                return "";
              }

              element.created_at = `'${new Date(element.created_at).toISOString()}'`;
              element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;

              element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
              element.diagnose = element.diagnose ? `'${element.diagnose}'` : element.diagnose;
              element.icd10 = element.icd10 ? `'${element.icd10}'` : element.icd10;
              element.icd10_text = element.icd10_text ? `'${element.icd10_text}'` : element.icd10_text;
              element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
              element.uid = element.uid ? `'${element.uid}'` : element.uid;
              element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;
              element.status_by = element.status_by ? `'${element.status_by}'` : element.status_by;
              element.source = element.source ? `'${element.source}'` : element.source;

              return "INSERT INTO t_patient_diagnose (uid_registration, diagnose, icd10, icd10_text, uid, uid_profile, uid_object, created_at, updated_at, source,type) VALUES(" + element.uid_registration + ", " + element.diagnose + ", " + element.icd10 + ", " + element.icd10_text + ", " + element.uid + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ", " + element.source + ", " + element.type + ");" + "\n";
            })[0];
            contentTPD = contentTPD ? contentTPD : "";

            let contentTPEM = tPatientExamMicro.rows.map((element) => {
              if (!element) {
                return "";
              }

              element.taken_date = `'${new Date(element.taken_date).toISOString()}'`;
              element.verified_date = `'${new Date(element.verified_date).toISOString()}'`;
              // console.log("ada", contentTPR);
              // console.log(JSON.stringify(element.microscopic_value));
              element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
              element.microscopic_value = element.microscopic_value ? `'${JSON.stringify(element.microscopic_value)}'` : element.microscopic_value;
              element.bacteria_result = element.bacteria_result ? `'${JSON.stringify(element.bacteria_result)}'` : element.bacteria_result;
              element.antibiotic_test_result = element.antibiotic_test_result ? `'${JSON.stringify(element.antibiotic_test_result)}'` : element.antibiotic_test_result;
              element.uid_t_patient_exam = element.uid_t_patient_exam ? `'${element.uid_t_patient_exam}'` : element.uid_t_patient_exam;
              element.mrn = element.mrn ? `'${element.mrn}'` : element.mrn;
              element.uid_registration = element.uid_registration ? `${element.uid_registration}` : element.uid_registration;
              element.sample_num = element.sample_num ? `'${element.sample_num}'` : element.sample_num;
              element.taken_by = element.taken_by ? `'${element.taken_by}'` : element.taken_by;
              element.verified_by = element.verified_by ? `'${element.verified_by}'` : element.verified_by;
              element.approved_by = element.approved_by ? `'${element.approved_by}'` : element.approved_by;
              element.uid_test = element.uid_test ? `'${element.uid_test}'` : element.uid_test;
              element.keterangan = element.keterangan ? `'${element.keterangan}'` : element.keterangan;
              element.isEdited = element.isEdited ? `'${element.isEdited}'` : element.isEdited;
              element.jaringan = element.jaringan ? `'${element.jaringan}'` : element.jaringan;
              element.request_type = element.request_type ? `'${element.request_type}'` : element.request_type;
              element.speciment_type = element.speciment_type ? `'${element.speciment_type}'` : element.speciment_type;
              element.id = element.id ? `'${element.id}'` : element.id;
              // element.isVerify = element.isVerify ? `'${element.isVerify}'` : element.isVerify;
              element.additional = element.additional ? `'${JSON.stringify(element.additional)}'` : element.additional;

              return "INSERT INTO t_patient_exam_microbiology (id, microscopic_value, growth, bacteria_result, antibiotic_test_result, uid_t_patient_exam, mrn, uid_registration, sample_num, taken_date, taken_by, verified_date, verified_by, approved_date, approved_by, uid_test, keterangan, jaringan, request_type, speciment_type, additional) VALUES(" + element.id + ", " + element.microscopic_value + ", " + element.growth + ", " + element.bacteria_result + ", " + element.antibiotic_test_result + ", " + element.uid_t_patient_exam + ", " + element.mrn + ", " + element.uid_registration + ", " + element.sample_num + ", " + element.taken_date + ", " + element.taken_by + ", " + element.verified_date + ", " + element.verified_by + ", " + element.approved_date + ", " + element.approved_by + ", " + element.uid_test + ", " + element.keterangan + ", " + element.jaringan + ", " + element.request_type + ", " + element.speciment_type + ", " + element.additional + ");" + "\n";
            })[0];
            contentTPEM = contentTPEM ? contentTPEM : "";
            let contentTPP = tPatientPayment.rows.map((element) => {
              if (!element) {
                return "";
              }

              element.created_at = `'${new Date(element.created_at).toISOString()}'`;
              element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;
              element.payment_date = `'${new Date(element.payment_date).toISOString()}'`;

              element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
              element.amount_of_bill = element.amount_of_bill ? `'${element.amount_of_bill}'` : element.amount_of_bill;
              element.amount_of_claim = element.amount_of_claim ? `'${element.amount_of_claim}'` : element.amount_of_claim;
              element.amount_of_payment = element.amount_of_payment ? `'${element.amount_of_payment}'` : element.amount_of_payment;
              element.amount_of_discount = element.amount_of_discount ? `'${element.amount_of_discount}'` : element.amount_of_discount;
              element.amount_of_tax = element.amount_of_tax ? `'${element.amount_of_tax}'` : element.amount_of_tax;
              element.remaining_pay = element.remaining_pay ? `'${element.remaining_pay}'` : element.remaining_pay;
              element.uid_billing = element.uid_billing ? `'${element.uid_billing}'` : element.uid_billing;
              element.uid_claim = element.uid_claim ? `'${element.uid_claim}'` : element.uid_claim;
              element.uid_payment_method = element.uid_payment_method ? `'${element.uid_payment_method}'` : element.uid_payment_method;
              element.card_number = element.card_number ? `'${element.card_number}'` : element.card_number;
              element.uid = element.uid ? `'${element.uid}'` : element.uid;
              element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
              element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;
              element.uid_claim = element.uid_claim ? `'${element.uid_claim}'` : element.uid_claim;

              element.discount = element.discount ? `'${element.discount}'` : element.discount;
              element.tax = element.tax ? `'${element.tax}'` : element.tax;
              element.reg_num = element.reg_num ? `'${element.reg_num}'` : element.reg_num;
              element.mrn = element.mrn ? `'${element.mrn}'` : element.mrn;

              return "INSERT INTO t_patient_payment (mrn, uid_registration, reg_num, amount_of_bill, amount_of_claim, amount_of_payment, amount_of_discount, amount_of_tax, remaining_pay, uid_billing, uid_claim, payment_date, uid_payment_method, card_number, uid, uid_profile, uid_object, created_at, updated_at, is_bridge, discount, tax) VALUES(" + element.mrn + ", " + element.uid_registration + ", " + element.reg_num + ", " + element.amount_of_bill + ", " + element.amount_of_claim + ", " + element.amount_of_payment + ", " + element.amount_of_discount + ", " + element.amount_of_tax + ", " + element.remaining_pay + ", " + element.uid_billing + ", " + element.uid_claim + ", " + element.payment_date + ", " + element.uid_payment_method + ", " + element.card_number + ", " + element.uid + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ", " + element.is_bridge + ", " + element.discount + ", " + element.tax + ");" + "\n";
            })[0];
            contentTPP = contentTPP ? contentTPP : "";
            contentTPE = contentTPE.join("");
            let contentFull = contentEBR + "\n" + contentTPR + "\n" + contentTPO + "\n" + contentTPOD + "\n" + contentTPS + "\n" + contentTPSS + "\n" + contentTPE + "\n" + contentTCS + "\n" + contentTPD + "\n" + contentTPEM + "\n" + contentTPP;

            fs.writeFile(element.lno + ".sql", contentFull, (err) => {
              if (err) {
                console.error(err);
              } else {
              }
            });
          }
        }
        // return eBridgeReceive.rows[0];
      })
    );
    // client2.release(); // Release the client back to the pool
    res.json({ dev: result1.rows, prod: await resultRecovery });
  } catch (error) {
    console.error("Error executing queries:", error);
    res.status(500).send("Internal Server Error", error);
  }
});

// Other routes and middleware...

app.listen(3000, () => {
  console.log("Server started on port 3000");
}).timeout = 300000;

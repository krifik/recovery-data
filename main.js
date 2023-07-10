require("dotenv").config();
// const express = require("express");
const Client = require("pg").Client;
const format = require("pg-format");
const he = require("he");

const fs = require("fs");
let dbConfig1;
let dbConfig2;
if (!process.env.DEBUG) {
  // DB 1 that data exist and want to store to DB 2
  dbConfig1 = {
    user: process.env.PG1_USER,
    host: process.env.PG1_HOST,
    // database: "djatiroto",
    database: process.env.PG1_DATABASE,
    password: process.env.PG1_PASS,
    port: process.env.PG1_PORT, // default PostgreSQL port
  };

  // DB 2 is DB to retrieve data from DB 1 and inserted it
  dbConfig2 = {
    user: process.env.PG2_USER,
    host: process.env.PG2_HOST,
    // database: "djatiroto",
    database: process.env.PG2_DATABASE,
    password: process.env.PG2_PASS,
    port: process.env.PG2_PORT, // default PostgreSQL port
  };
} else {
  dbConfig1 = {
    user: "postgres",
    host: "0.0.0.0",
    database: "pantinugroho",
    password: "p@ssw0rd",
    port: 5432, // default PostgreSQL port
  };

  dbConfig2 = {
    user: "postgres",
    host: "0.0.0.0",
    database: "medimas_fix",
    password: "",
    port: 5432, // default PostgreSQL port
  };
}

let startDate = process.env.START_DATE;
let endDate = process.env.END_DATE;
console.log(startDate);
console.log(endDate);
const client1 = new Client(dbConfig1);
client1.connect();
const client2 = new Client(dbConfig2);
client2.connect();

async function bridging(startDate, endDate) {
  try {
    console.log("Ambil data bridging");
    const result1 = await client1.query("SELECT * FROM e_bridge_receive WHERE created_at BETWEEN $1 AND $2", [startDate, endDate]);
    // client1.release(); // Release the client back to the pool
    console.log(result1.command);
    console.log("Jumlah dari DB 1: " + result1.rowCount);
    // const client2 = await pool2.connect();
    resultRecovery = Promise.all(
      result1.rows.map(async (element) => {
        const eBridgeReceive = await client2.query("SELECT * FROM e_bridge_receive WHERE ono='" + element.ono + "' LIMIT 1");
        // insert e bridge receive
        element.created_at = new Date(element.created_at).toISOString();
        if (eBridgeReceive.rowCount === 0) {
          let counter = 0;
          counter++;
          console.log("Jumlah dari DB 2 yang gaada di DB 1: " + counter);
          const tPatientRegistration = await client1.query("SELECT * FROM t_patient_registration WHERE reg_num='" + element.lno + "' LIMIT 1");
          let tPatientRegistrationItem = tPatientRegistration.rows[0];
          let tPatientOrderDetail = await client1.query("SELECT * FROM t_patient_order_detail WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
          let tPatientOrder = await client1.query("SELECT * FROM t_patient_order WHERE uid_registration='" + tPatientRegistrationItem.uid + "'");
          let contentTP = "";
          if (tPatientOrder.rowCount > 0) {
            const tPatientRegistrationC2 = await client2.query("SELECT * FROM t_patient_registration WHERE reg_num='" + tPatientRegistrationItem.reg_num + "' LIMIT 1");
            if (tPatientRegistrationC2.rowCount > 0) {
              let tPatientC2 = await client2.query("SELECT * FROM t_patient WHERE mrn='" + tPatientRegistrationC2.rows[0].mrn + "'");
              if (tPatientC2.rowCount === 0) {
                let tPatient = await client1.query("SELECT * FROM t_patient WHERE mrn='" + tPatientRegistrationC2.rows[0].mrn + "'");
                tPatient.rows[0].created_at = `'${new Date(tPatient.rows[0].created_at).toISOString()}'`;
                tPatient.rows[0].updated_at = `'${new Date(tPatient.rows[0].updated_at).toISOString()}'`;
                tPatient.rows[0].membership_date = `'${new Date(tPatient.rows[0].membership_date).toISOString()}'`;
                tPatient.rows[0].dob = `'${new Date(tPatient.rows[0].dob).toISOString()}'`;

                tPatient.rows[0].mrn = tPatient.rows[0].mrn ? `'${tPatient.rows[0].mrn}'` : tPatient.rows[0].mrn;
                tPatient.rows[0].name = tPatient.rows[0].name ? `'${tPatient.rows[0].name}'` : tPatient.rows[0].name;
                tPatient.rows[0].gender = tPatient.rows[0].gender ? `'${tPatient.rows[0].gender}'` : tPatient.rows[0].gender;
                tPatient.rows[0].address = tPatient.rows[0].address ? `'${tPatient.rows[0].address}'` : null;
                tPatient.rows[0].phone = tPatient.rows[0].phone ? `'${tPatient.rows[0].phone}'` : null;
                tPatient.rows[0].email = tPatient.rows[0].email ? `'${tPatient.rows[0].email}'` : null;
                tPatient.rows[0].pob = tPatient.rows[0].pob ? `'${tPatient.rows[0].pob}'` : null;
                tPatient.rows[0].uid = tPatient.rows[0].uid ? `'${tPatient.rows[0].uid}'` : tPatient.rows[0].uid;
                tPatient.rows[0].source = tPatient.rows[0].source ? `'${tPatient.rows[0].source}'` : tPatient.rows[0].source;
                tPatient.rows[0].uid_profile = tPatient.rows[0].uid_profile ? `'${tPatient.rows[0].uid_profile}'` : tPatient.rows[0].uid_profile;
                tPatient.rows[0].uid_object = tPatient.rows[0].uid_object ? `'${tPatient.rows[0].uid_object}'` : tPatient.rows[0].uid_object;
                tPatient.rows[0].nik = tPatient.rows[0].nik ? `'${tPatient.rows[0].nik}'` : null;
                tPatient.rows[0].title = tPatient.rows[0].title ? `'${tPatient.rows[0].title}'` : tPatient.rows[0].gender === "M" ? "Mr." : "Mrs. ";
                contentTP = "INSERT INTO t_patient (mrn, name, title, gender, dob, address, phone, email, membership_date, pob, uid, enabled, source, uid_profile, uid_object, nik) VALUES(" + tPatient.rows[0].mrn + ", " + tPatient.rows[0].name + ", " + tPatient.rows[0].title + ", " + tPatient.rows[0].gender + ", " + tPatient.rows[0].dob + ", " + tPatient.rows[0].address + ", " + tPatient.rows[0].phone + ", " + tPatient.rows[0].email + ", " + tPatient.rows[0].membership_date + ", " + tPatient.rows[0].pob + ", " + tPatient.rows[0].uid + ", " + tPatient.rows[0].enabled + " , " + tPatient.rows[0].source + ", " + tPatient.rows[0].uid_profile + ", " + tPatient.rows[0].uid_object + ", " + tPatient.rows[0].nik + ");";
              }
            }

            let tHistoryApproveSample = await client1.query("SELECT * FROM t_history_approve_sample WHERE reg_num='" + tPatientRegistrationItem.reg_num + "'");
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

            // element.text_result = format("%L", element.text_result);
            // element.text_order = format("%L", element.text_order);
            let contentEBR = format(
              `INSERT INTO e_bridge_receive (ono, lno, text_result, text_order, release_date, validate, created_at, updated_at, split_date, source, result_message_id)
              VALUES (%L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L);`,
              element.ono,
              element.lno,
              element.text_result,
              element.text_order,
              element.release_date,
              element.release_date,
              element.created_at,
              element.updated_at,
              element.split_date,
              element.source,
              element.result_message_id
            );

            tPatientRegistrationItem.created_at = `'${new Date(tPatientRegistrationItem.created_at).toISOString()}'`;
            tPatientRegistrationItem.updated_at = `'${new Date(tPatientRegistrationItem.updated_at).toISOString()}'`;
            tPatientRegistrationItem.cancelation_date = null;
            tPatientRegistrationItem.registration_date = `'${new Date(tPatientRegistrationItem.registration_date).toISOString()}'`;

            tPatientRegistrationItem.patient_type = !tPatientRegistrationItem.patient_type ? tPatientRegistrationItem.patient_type : `'${tPatientRegistrationItem.patient_type}'`;
            tPatientRegistrationItem.fast_note = tPatientRegistrationItem.fast_note ? `'${tPatientRegistrationItem.fast_note}'` : null;
            // tPatientRegistrationItem.fast_note = !tPatientRegistrationItem.fast_note ? tPatientRegistrationItem.fast_note : `'${tPatientRegistrationItem.fast_note}'`;
            tPatientRegistrationItem.mrn = !tPatientRegistrationItem.mrn ? tPatientRegistrationItem.mrn : `'${tPatientRegistrationItem.mrn}'`;
            tPatientRegistrationItem.guarantor = !tPatientRegistrationItem.guarantor ? tPatientRegistrationItem.guarantor : `'${tPatientRegistrationItem.guarantor}'`;
            tPatientRegistrationItem.members_number = !tPatientRegistrationItem.members_number ? null : `'${tPatientRegistrationItem.members_number}'`;
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

            let contentTHAS = tHistoryApproveSample.rows
              .map((element) => {
                // console.log("ADA", contentTPR);
                if (!element) {
                  return "";
                }

                element.created_at = `'${new Date(element.created_at).toISOString()}'`;
                element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;
                element.acc_date = `'${new Date(element.acc_date).toISOString()}'`;

                element.mrn = element.mrn ? `'${element.mrn}'` : element.mrn;
                element.uid = element.uid ? `'${element.uid}'` : element.uid;
                element.reg_num = element.reg_num ? `'${element.reg_num}'` : element.reg_num;
                element.uid_acc_by = element.uid_acc_by ? `'${element.uid_acc_by}'` : element.uid_acc_by;
                element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
                element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;

                return "INSERT INTO t_history_approve_sample (mrn, reg_num, acc_date, uid, uid_acc_by, enabled, uid_profile, uid_object, created_at, updated_at) VALUES(" + element.mrn + ", " + element.reg_num + ", " + element.acc_date + ", " + element.uid + ", " + element.uid_acc_by + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ");" + "\n";
              })
              .join("\n");
            contentTHAS = contentTHAS ? contentTHAS : "";
            // t patient order
            let contentTPO = tPatientOrder.rows
              .map((element) => {
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
              })
              .join("");

            let contentTPOD = tPatientOrderDetail.rows
              .map((element) => {
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
              })
              .join("");

            let contentTPS = tPatientSample.rows
              .map((element) => {
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
              })
              .join("\n");
            contentTPS = contentTPS ? contentTPS : "";
            let contentTPSS = tPatientSampleSpeciment.rows
              .map((element) => {
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
              })
              .join("\n");
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
                element.role_text = element.role_text ? `'${element.role_text}'` : null;
                element.sign = element.sign ? `'${element.sign}'` : element.sign;
                element.print_date = `'${new Date(element.print_date).toISOString()}'`;
                const escapedValueMemo = element.value_memo ? `'${he.escape(element.value_memo)}'` : null;
                examContent = "INSERT INTO t_patient_examination (mrn, uid_registration, uid_test, value, value_string, value_memo, is_verify, verify_date, print_date, uid_verify_by, uid_instrument, is_acc, acc_date, is_edit, flag, pending_date, pending_by, uid_acc_by, uid_created_by, uid_action_by, uid_package, uid_panel, uid_parent, uid_nilai_normal, uid, enabled, uid_profile, uid_object, created_at, updated_at, approve_mobile, uid_rolebase, role_text, sign, id_order, is_duplo) VALUES(" + element.mrn + ", " + element.uid_registration + ", " + element.uid_test + ", " + element.value + ", " + element.value_string + ", " + escapedValueMemo + ", " + element.is_verify + ", " + element.verify_date + ", " + element.print_date + ", " + element.uid_verify_by + ", " + element.uid_instrument + ", " + element.is_acc + ", " + element.acc_date + ", " + element.is_edit + ", " + element.flag + ", " + element.pending_date + ", " + element.pending_by + ", " + element.uid_acc_by + ", " + element.uid_created_by + ", " + element.uid_action_by + ", " + element.uid_package + ", " + element.uid_panel + ", " + element.uid_parent + ", " + element.uid_nilai_normal + ", " + element.uid + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + "," + element.created_at + ", " + element.updated_at + ", " + element.approve_mobile + ", " + element.uid_rolebase + "," + element.role_text + "," + element.sign + ", " + element.id_order + "," + element.is_duplo + ");\n";

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
                  tPatientExaminationCritical.rows[0].confirm_user = tPatientExaminationCritical.rows[0].confirm_user ? `'${tPatientExaminationCritical.rows[0].confirm_user}'` : tPatientExaminationCritical.rows[0].confirm_user;
                  tPatientExaminationCritical.rows[0].confirm_date = tPatientExaminationCritical.rows[0].confirm_date ? `'${new Date(tPatientExaminationCritical.rows[0].confirm_date).toISOString()}'` : tPatientExaminationCritical.rows[0].confirm_date;

                  // tPatientExaminationCritical.rows[0].confirm_date = new Date(tPatientExaminationCritical.rows[0].confirm_date).toISOString();

                  examContent += "INSERT INTO t_patient_examination_critical (uid_patient_exam, remark, uid_user_by, uid_user_to, uid, enabled, uid_profile, uid_object,  created_at, updated_at, confirm_date, confirm_user) VALUES(" + tPatientExaminationCritical.rows[0].uid_patient_exam + ", " + tPatientExaminationCritical.rows[0].remark + ", " + tPatientExaminationCritical.rows[0].uid_user_by + ", " + tPatientExaminationCritical.rows[0].uid_user_to + ", " + tPatientExaminationCritical.rows[0].uid + ", " + tPatientExaminationCritical.rows[0].enabled + ", " + tPatientExaminationCritical.rows[0].uid_profile + ", " + tPatientExaminationCritical.rows[0].uid_object + ", " + tPatientExaminationCritical.rows[0].created_at + ", " + tPatientExaminationCritical.rows[0].updated_at + ", " + tPatientExaminationCritical.rows[0].confirm_date + ", " + tPatientExaminationCritical.rows[0].confirm_user + ");\n";
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
                  tCommentTest.rows[0].status_date = tCommentTest.rows[0].status_date ? `'${new Date(tCommentTest.rows[0].status_date).toISOString()}'` : tCommentTest.rows[0].status_date;

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
                  const escapedValueMemo = tHistoryApprove.rows[0].value_memo ? `'${he.escape(tHistoryApprove.rows[0].value_memo)}'` : null;
                  examContent += "INSERT INTO t_history_approve (uid_examination, uid_test, value, value_string, is_acc, acc_date, uid_acc_by, flag, value_memo, enabled, uid_profile, uid_object, uid, created_at, updated_at, reason) VALUES(" + tHistoryApprove.rows[0].uid_examination + ", " + tHistoryApprove.rows[0].uid_test + ", " + tHistoryApprove.rows[0].value + ", " + tHistoryApprove.rows[0].value_string + ", " + tHistoryApprove.rows[0].is_acc + ", " + tHistoryApprove.rows[0].acc_date + ", " + tHistoryApprove.rows[0].uid_acc_by + ", '" + tHistoryApprove.rows[0].flag + "', " + escapedValueMemo + ", " + tHistoryApprove.rows[0].enabled + ", " + tHistoryApprove.rows[0].uid_profile + ", " + tHistoryApprove.rows[0].uid_object + ", " + tHistoryApprove.rows[0].uid + ", " + tHistoryApprove.rows[0].created_at + ", " + tHistoryApprove.rows[0].updated_at + ", " + tHistoryApprove.rows[0].reason + ");\n";
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
                  tHistoryVerify.rows[0].reason = tHistoryVerify.rows[0].reason ? `'${tHistoryVerify.rows[0].reason}'` : `'${"-"}'`;
                  tHistoryVerify.rows[0].flag = tHistoryVerify.rows[0].flag ? `'${tHistoryVerify.rows[0].flag}'` : tHistoryVerify.rows[0].flag;

                  tHistoryVerify.rows[0].verify_date = `'${new Date(tHistoryVerify.rows[0].verify_date).toISOString()}'`;
                  tHistoryVerify.rows[0].created_at = `'${new Date(tHistoryVerify.rows[0].created_at).toISOString()}'`;
                  tHistoryVerify.rows[0].updated_at = `'${new Date(tHistoryVerify.rows[0].updated_at).toISOString()}'`;

                  const escapedValueMemo = tHistoryVerify.rows[0].value_memo ? `'${he.escape(tHistoryVerify.rows[0].value_memo)}'` : null;
                  examContent += "INSERT INTO t_history_verify (uid_examination, uid_test, value, value_string, is_verify, verify_date, uid_verify_by, flag, value_memo, enabled, uid_profile, uid_object, uid, created_at, updated_at, reason) VALUES(" + tHistoryVerify.rows[0].uid_examination + ", " + tHistoryVerify.rows[0].uid_test + ", " + tHistoryVerify.rows[0].value + ", " + tHistoryVerify.rows[0].value_string + ", " + tHistoryVerify.rows[0].is_verify + ", " + tHistoryVerify.rows[0].verify_date + ", " + tHistoryVerify.rows[0].uid_verify_by + ", " + tHistoryVerify.rows[0].flag + ", " + escapedValueMemo + ", " + tHistoryVerify.rows[0].enabled + ", " + tHistoryVerify.rows[0].uid_profile + ", " + tHistoryVerify.rows[0].uid_object + ", " + tHistoryVerify.rows[0].uid + ", " + tHistoryVerify.rows[0].created_at + ", " + tHistoryVerify.rows[0].updated_at + ", " + tHistoryVerify.rows[0].reason + ");\n";
                }
                // console.log(examContent);
                return examContent;
              })
            );
            // console.log(contentTPE.includes("t_patient_examination_critical") ? contentTPE : "");
            // contentTPE = contentTPE.replace(",INSERT", "INSERT");
            contentTPE[0] = contentTPE[0] ? contentTPE[0] : "";
            let contentTCS = tCommentSample.rows
              .map((element) => {
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
              })
              .join("");
            contentTCS = contentTCS ? contentTCS : "";

            let contentTPD = tPatientDiagnose.rows
              .map((element) => {
                if (!element) {
                  return "";
                }

                element.created_at = `'${new Date(element.created_at).toISOString()}'`;
                element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;

                element.uid_registration = element.uid_registration ? `'${element.uid_registration}'` : element.uid_registration;
                element.diagnose = element.diagnose ? `'${element.diagnose}'` : element.diagnose;
                element.icd10 = element.icd10 ? `'${element.icd10}'` : null;
                element.icd10_text = element.icd10_text ? `'${element.icd10_text}'` : null;
                element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
                element.uid = element.uid ? `'${element.uid}'` : element.uid;
                element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;
                element.status_by = element.status_by ? `'${element.status_by}'` : element.status_by;
                element.source = element.source ? `'${element.source}'` : element.source;

                return "INSERT INTO t_patient_diagnose (uid_registration, diagnose, icd10, icd10_text, uid, uid_profile, uid_object, created_at, updated_at, source,type) VALUES(" + element.uid_registration + ", " + element.diagnose + ", " + element.icd10 + ", " + element.icd10_text + ", " + element.uid + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ", " + element.source + ", " + element.type + ");" + "\n";
              })
              .join("");
            contentTPD = contentTPD ? contentTPD : "";

            let contentTPEM = tPatientExamMicro.rows
              .map((element) => {
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
              })
              .join("");
            contentTPEM = contentTPEM ? contentTPEM : "";
            let contentTPP = tPatientPayment.rows
              .map((element) => {
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
              })
              .join("");
            contentTPP = contentTPP ? contentTPP : "";
            contentTPE = contentTPE.join("");

            contentTHAS = contentTHAS ? contentTHAS : "";
            let contentFull = contentEBR + "\n" + contentTPR + "\n" + contentTPO + "\n" + contentTPOD + "\n" + contentTPS + "\n" + contentTPSS + "\n" + contentTPE + "\n" + contentTCS + "\n" + contentTPD + "\n" + contentTPEM + "\n" + contentTPP + "\n" + contentTHAS + "\n" + contentTP;

            fs.writeFile("./app/bridging/" + element.lno + ".sql", contentFull, (err) => {
              console.log("Writing SQL");
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
    console.log("Bridging selesai!");
  } catch (error) {
    console.error("Error executing queries:", error);
  }
}

async function manual(startDate, endDate) {
  try {
    console.log("Ambil data manual");
    const result1 = await client1.query("SELECT * FROM t_patient_registration WHERE created_at BETWEEN $1 AND $2 AND is_bridge=false", [startDate, endDate]);
    // client1.release(); // Release the client back to the pool
    resultRecovery = await Promise.all(
      result1.rows.map(async (element) => {
        const tPatientRegistration = await client2.query("SELECT * FROM t_patient_registration WHERE reg_num='" + element.reg_num + "' LIMIT 1");
        // let tPatientRegistrationItem = tPatientRegistration.rows[0];
        // insert e bridge receive
        element.created_at = new Date(element.created_at).toISOString();
        if (tPatientRegistration.rowCount === 0) {
          let tPatientOrderDetail = await client1.query("SELECT * FROM t_patient_order_detail WHERE uid_registration='" + element.uid + "'");
          let tPatientOrder = await client1.query("SELECT * FROM t_patient_order WHERE uid_registration='" + element.uid + "'");
          let tPatient = await client1.query("SELECT * FROM t_patient WHERE mrn='" + element.mrn + "'");
          let tPatientC2 = await client2.query("SELECT * FROM t_patient WHERE mrn='" + element.mrn + "'");
          if (tPatientOrder.rowCount > 0) {
            let contentTP = "";
            if (tPatientC2.rowCount === 0) {
              tPatient.rows[0].created_at = `'${new Date(tPatient.rows[0].created_at).toISOString()}'`;
              tPatient.rows[0].updated_at = `'${new Date(tPatient.rows[0].updated_at).toISOString()}'`;
              tPatient.rows[0].membership_date = `'${new Date(tPatient.rows[0].membership_date).toISOString()}'`;
              tPatient.rows[0].dob = `'${new Date(tPatient.rows[0].dob).toISOString()}'`;

              tPatient.rows[0].mrn = tPatient.rows[0].mrn ? `'${tPatient.rows[0].mrn}'` : tPatient.rows[0].mrn;
              tPatient.rows[0].name = tPatient.rows[0].name ? `'${tPatient.rows[0].name}'` : tPatient.rows[0].name;
              tPatient.rows[0].gender = tPatient.rows[0].gender ? `'${tPatient.rows[0].gender}'` : tPatient.rows[0].gender;
              tPatient.rows[0].address = tPatient.rows[0].address ? `'${tPatient.rows[0].address}'` : null;
              tPatient.rows[0].phone = tPatient.rows[0].phone ? `'${tPatient.rows[0].phone}'` : null;
              tPatient.rows[0].email = tPatient.rows[0].email ? `'${tPatient.rows[0].email}'` : null;
              tPatient.rows[0].pob = tPatient.rows[0].pob ? `'${tPatient.rows[0].pob}'` : null;
              tPatient.rows[0].uid = tPatient.rows[0].uid ? `'${tPatient.rows[0].uid}'` : tPatient.rows[0].uid;
              tPatient.rows[0].source = tPatient.rows[0].source ? `'${tPatient.rows[0].source}'` : tPatient.rows[0].source;
              tPatient.rows[0].uid_profile = tPatient.rows[0].uid_profile ? `'${tPatient.rows[0].uid_profile}'` : tPatient.rows[0].uid_profile;
              tPatient.rows[0].uid_object = tPatient.rows[0].uid_object ? `'${tPatient.rows[0].uid_object}'` : tPatient.rows[0].uid_object;
              tPatient.rows[0].nik = tPatient.rows[0].nik ? `'${tPatient.rows[0].nik}'` : null;
              tPatient.rows[0].title = tPatient.rows[0].title ? `'${tPatient.rows[0].title}'` : tPatient.rows[0].gender === "M" ? "Mr." : "Mrs. ";

              contentTP = "INSERT INTO t_patient (mrn, name, title, gender, dob, address, phone, email, membership_date, pob, uid, enabled, source, uid_profile, uid_object, nik) VALUES(" + tPatient.rows[0].mrn + ", " + tPatient.rows[0].name + ", " + tPatient.rows[0].title + ", " + tPatient.rows[0].gender + ", " + tPatient.rows[0].dob + ", " + tPatient.rows[0].address + ", " + tPatient.rows[0].phone + ", " + tPatient.rows[0].email + ", " + tPatient.rows[0].membership_date + ", " + tPatient.rows[0].pob + ", " + tPatient.rows[0].uid + ", " + tPatient.rows[0].enabled + " , " + tPatient.rows[0].source + ", " + tPatient.rows[0].uid_profile + ", " + tPatient.rows[0].uid_object + ", " + tPatient.rows[0].nik + ");";
            }
            let tPatientSample = await client1.query("SELECT * FROM t_patient_sample WHERE uid_registration='" + element.uid + "'");
            let tPatientSampleSpeciment = await client1.query("SELECT * FROM t_patient_sample_speciment WHERE uid_registration='" + element.uid + "'");
            let tPatientPayment = await client1.query("SELECT * FROM t_patient_payment WHERE uid_registration='" + element.uid + "'");
            let tHistoryApproveSample = await client1.query("SELECT * FROM t_history_approve_sample WHERE reg_num='" + element.reg_num + "'");

            let tPatientExamination = await client1.query("SELECT * FROM t_patient_examination WHERE uid_registration='" + element.uid + "'");

            let tCommentSample = await client1.query("SELECT * FROM t_comment_sample WHERE uid_registration='" + element.uid + "'");
            let tPatientDiagnose = await client1.query("SELECT * FROM t_patient_diagnose WHERE uid_registration='" + element.uid + "'");
            let tPatientExamMicro = await client1.query("SELECT * FROM t_patient_exam_microbiology WHERE uid_registration='" + element.uid + "'");
            element.updated_at = new Date(element.updated_at).toISOString();
            element.release_date = element.release_date ? new Date(element.release_date).toISOString() : null;
            console.log(element.release_date);
            // element.split_date = new Date(element.split_date).toISOString();
            element.split_date = element.split_date ? new Date(element.split_date).toISOString() : null;
            let contentEBR = "INSERT INTO e_bridge_receive (ono, lno, text_result, text_order, release_date, validate, created_at, updated_at, split_date, source, result_message_id) VALUES('" + element.ono + "' ,'" + element.lno + "','" + element.text_result + "', '" + element.text_order + "' , '" + element.release_date + "','" + element.release_date + "','" + element.created_at + "','" + element.updated_at + "','" + element.split_date + "', '" + element.source + "', '" + element.result_message_id + "');";

            element.created_at = `'${new Date(element.created_at).toISOString()}'`;
            element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;
            element.cancelation_date = null;
            element.registration_date = `'${new Date(element.registration_date).toISOString()}'`;

            element.patient_type = !element.patient_type ? element.patient_type : `'${element.patient_type}'`;
            element.fast_note = element.fast_note ? `'${element.fast_note}'` : null;
            // element.fast_note = !element.fast_note ? element.fast_note : `'${element.fast_note}'`;
            element.mrn = !element.mrn ? element.mrn : `'${element.mrn}'`;
            element.guarantor = !element.guarantor ? element.guarantor : `'${element.guarantor}'`;
            element.members_number = !element.members_number ? null : `'${element.members_number}'`;
            element.referral_type = !element.referral_type ? element.referral_type : `'${element.referral_type}'`;
            element.uid_ward = !element.uid_ward ? element.uid_ward : `'${element.uid_ward}'`;
            element.uid_class = !element.uid_class ? element.uid_class : `'${element.uid_class}'`;
            element.uid_doctor_referral = !element.uid_doctor_referral ? element.uid_doctor_referral : `'${element.uid_doctor_referral}'`;
            element.reg_num = !element.reg_num ? element.reg_num : `'${element.reg_num}'`;
            element.created_by = !element.created_by ? element.created_by : `'${element.created_by}'`;
            element.uid_updated_by = element.uid_updated_by = !element.uid_updated_by ? element.uid_updated_by : `'${element.uid_updated_by}'`;
            element.uid = !element.uid ? element.uid : `'${element.uid}'`;
            element.uid_profile = !element.uid_profile ? element.uid_profile : `'${element.uid_profile}'`;
            element.uid_object = !element.uid_object ? element.uid_object : `'${element.uid_object}'`;
            element.room_number = !element.room_number ? element.room_number : `'${element.room_number}'`;
            element.source = !element.source ? element.source : `'${element.source}'`;
            element.no_reg = !element.no_reg ? element.no_reg : `'${element.no_reg}'`;
            element.sign_fast = !element.sign_fast ? element.sign_fast : `'${element.sign_fast}'`;
            element.fast_note = !element.fast_note ? element.fast_note : `'${element.fast_note}'`;
            element.uid_doctor_incharge = !element.uid_doctor_incharge ? element.uid_doctor_incharge : `'${element.uid_doctor_incharge}'`;
            element.uid_facility_referral = !element.uid_facility_referral ? element.uid_facility_referral : `'${element.uid_facility_referral}'`;
            element.uid_doctor = !element.uid_doctor ? element.uid_doctor : `'${element.uid_doctor}'`;
            let contentTPR = "INSERT INTO t_patient_registration (mrn, patient_type, guarantor, members_number, referral_type, uid_ward, uid_class, uid_doctor_referral, uid_facility_referral, uid_doctor, is_cyto, reg_num, registration_date,created_by, uid_updated_by, uid, enabled, uid_profile, uid_object, created_at, updated_at, cancelation_remark, cancelation_date, is_bridge, room_number, source, no_reg, sign_fast, fast_note, is_pregnant, is_mcu, uid_doctor_incharge) VALUES(" + element.mrn + " ," + element.patient_type + "," + element.guarantor + ", " + element.members_number + " , " + element.referral_type + ", " + element.uid_ward + ", " + element.uid_class + ", " + element.uid_doctor_referral + ", " + element.uid_facility_referral + ", " + element.uid_doctor + ", " + element.is_cyto + ", " + element.reg_num + ", " + element.registration_date + ", " + element.created_by + ", " + element.uid_updated_by + ", " + element.uid + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ", " + element.cancelation_remark + ", " + element.cancelation_date + ", " + element.is_bridge + ", " + element.room_number + ", " + element.source + ", " + element.no_reg + ", " + element.sign_fast + ", " + element.fast_note + ", " + element.is_pregnant + ", " + element.is_mcu + ", " + element.uid_doctor_incharge + ");";

            // t patient order
            let contentTPO = tPatientOrder.rows
              .map((element) => {
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
              })
              .join("");

            let contentTPOD = tPatientOrderDetail.rows
              .map((element) => {
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
              })
              .join("");

            let contentTPS = tPatientSample.rows
              .map((element) => {
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
              })
              .join("");

            let contentTPSS = tPatientSampleSpeciment.rows
              .map((element) => {
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
              })
              .join("");
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
                element.print_date = `'${new Date(element.print_date).toISOString()}'`;
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
                element.role_text = element.role_text ? `'${element.role_text}'` : null;
                element.sign = element.sign ? `'${element.sign}'` : element.sign;
                const escapedValueMemo = element.value_memo ? `'${he.escape(element.value_memo)}'` : null;
                examContent = "INSERT INTO t_patient_examination (mrn, uid_registration, uid_test, value, value_string, value_memo, is_verify, verify_date, print_date, uid_verify_by, uid_instrument, is_acc, acc_date, is_edit, flag, pending_date, pending_by, uid_acc_by, uid_created_by, uid_action_by, uid_package, uid_panel, uid_parent, uid_nilai_normal, uid, enabled, uid_profile, uid_object, created_at, updated_at, approve_mobile, uid_rolebase, role_text, sign, id_order, is_duplo) VALUES(" + element.mrn + ", " + element.uid_registration + ", " + element.uid_test + ", " + element.value + ", " + element.value_string + ", " + escapedValueMemo + ", " + element.is_verify + ", " + element.verify_date + ", " + element.print_date + ", " + element.uid_verify_by + ", " + element.uid_instrument + ", " + element.is_acc + ", " + element.acc_date + ", " + element.is_edit + ", " + element.flag + ", " + element.pending_date + ", " + element.pending_by + ", " + element.uid_acc_by + ", " + element.uid_created_by + ", " + element.uid_action_by + ", " + element.uid_package + ", " + element.uid_panel + ", " + element.uid_parent + ", " + element.uid_nilai_normal + ", " + element.uid + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + "," + element.created_at + ", " + element.updated_at + ", " + element.approve_mobile + ", " + element.uid_rolebase + "," + element.role_text + "," + element.sign + ", " + element.id_order + "," + element.is_duplo + ");\n";

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
                  tPatientExaminationCritical.rows[0].confirm_user = tPatientExaminationCritical.rows[0].confirm_user ? `'${tPatientExaminationCritical.rows[0].confirm_user}'` : tPatientExaminationCritical.rows[0].confirm_user;
                  tPatientExaminationCritical.rows[0].confirm_date = tPatientExaminationCritical.rows[0].confirm_date ? `'${new Date(tPatientExaminationCritical.rows[0].confirm_date).toISOString()}'` : tPatientExaminationCritical.rows[0].confirm_date;
                  // tPatientExaminationCritical.rows[0].confirm_date = new Date(tPatientExaminationCritical.rows[0].confirm_date).toISOString();

                  examContent += "INSERT INTO t_patient_examination_critical (uid_patient_exam, remark, uid_user_by, uid_user_to, uid, enabled, uid_profile, uid_object,  created_at, updated_at, confirm_date, confirm_user) VALUES(" + tPatientExaminationCritical.rows[0].uid_patient_exam + ", " + tPatientExaminationCritical.rows[0].remark + ", " + tPatientExaminationCritical.rows[0].uid_user_by + ", " + tPatientExaminationCritical.rows[0].uid_user_to + ", " + tPatientExaminationCritical.rows[0].uid + ", " + tPatientExaminationCritical.rows[0].enabled + ", " + tPatientExaminationCritical.rows[0].uid_profile + "," + tPatientExaminationCritical.rows[0].uid_object + ", " + tPatientExaminationCritical.rows[0].created_at + ", " + tPatientExaminationCritical.rows[0].updated_at + ", " + tPatientExaminationCritical.rows[0].confirm_date + ", " + tPatientExaminationCritical.rows[0].confirm_user + ");\n";
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
                  tCommentTest.rows[0].status_date = tCommentTest.rows[0].status_date ? `'${new Date(tCommentTest.rows[0].status_date).toISOString()}'` : tCommentTest.rows[0].status_date;

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
                  const escapedValueMemo = tHistoryApprove.rows[0].value_memo ? `'${he.escape(tHistoryApprove.rows[0].value_memo)}'` : null;
                  examContent += "INSERT INTO t_history_approve (uid_examination, uid_test, value, value_string, is_acc, acc_date, uid_acc_by, flag, value_memo, enabled, uid_profile, uid_object, uid, created_at, updated_at, reason) VALUES(" + tHistoryApprove.rows[0].uid_examination + ", " + tHistoryApprove.rows[0].uid_test + ", " + tHistoryApprove.rows[0].value + ", " + tHistoryApprove.rows[0].value_string + ", " + tHistoryApprove.rows[0].is_acc + ", " + tHistoryApprove.rows[0].acc_date + ", " + tHistoryApprove.rows[0].uid_acc_by + ", '" + tHistoryApprove.rows[0].flag + "', " + escapedValueMemo + ", " + tHistoryApprove.rows[0].enabled + ", " + tHistoryApprove.rows[0].uid_profile + ", " + tHistoryApprove.rows[0].uid_object + ", " + tHistoryApprove.rows[0].uid + ", " + tHistoryApprove.rows[0].created_at + ", " + tHistoryApprove.rows[0].updated_at + ", " + tHistoryApprove.rows[0].reason + ");\n";
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
                  tHistoryVerify.rows[0].reason = tHistoryVerify.rows[0].reason ? `'${tHistoryVerify.rows[0].reason}'` : `'${"-"}'`;
                  tHistoryVerify.rows[0].flag = tHistoryVerify.rows[0].flag ? `'${tHistoryVerify.rows[0].flag}'` : tHistoryVerify.rows[0].flag;

                  tHistoryVerify.rows[0].verify_date = `'${new Date(tHistoryVerify.rows[0].verify_date).toISOString()}'`;
                  tHistoryVerify.rows[0].created_at = `'${new Date(tHistoryVerify.rows[0].created_at).toISOString()}'`;
                  tHistoryVerify.rows[0].updated_at = `'${new Date(tHistoryVerify.rows[0].updated_at).toISOString()}'`;
                  const escapedValueMemo = tHistoryVerify.rows[0].value_memo ? `'${he.escape(tHistoryVerify.rows[0].value_memo)}'` : null;
                  examContent += "INSERT INTO t_history_verify (uid_examination, uid_test, value, value_string, is_verify, verify_date, uid_verify_by, flag, value_memo, enabled, uid_profile, uid_object, uid, created_at, updated_at, reason) VALUES(" + tHistoryVerify.rows[0].uid_examination + ", " + tHistoryVerify.rows[0].uid_test + ", " + tHistoryVerify.rows[0].value + ", " + tHistoryVerify.rows[0].value_string + ", " + tHistoryVerify.rows[0].is_verify + ", " + tHistoryVerify.rows[0].verify_date + ", " + tHistoryVerify.rows[0].uid_verify_by + ", " + tHistoryVerify.rows[0].flag + ", " + escapedValueMemo + ", " + tHistoryVerify.rows[0].enabled + ", " + tHistoryVerify.rows[0].uid_profile + ", " + tHistoryVerify.rows[0].uid_object + ", " + tHistoryVerify.rows[0].uid + ", " + tHistoryVerify.rows[0].created_at + ", " + tHistoryVerify.rows[0].updated_at + ", " + tHistoryVerify.rows[0].reason + ");\n";
                }
                // console.log(examContent);
                return examContent;
              })
            );
            // console.log(contentTPE.includes("t_patient_examination_critical") ? contentTPE : "");
            // contentTPE = contentTPE.replace(",INSERT", "INSERT");
            contentTPE[0] = contentTPE[0] ? contentTPE[0] : "";
            let contentTCS = tCommentSample.rows
              .map((element) => {
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
              })
              .join("\n");
            contentTCS = contentTCS ? contentTCS : "";

            let contentTPD = tPatientDiagnose.rows
              .map((element) => {
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
              })
              .join("\n");
            contentTPD = contentTPD ? contentTPD : "";

            let contentTPEM = tPatientExamMicro.rows
              .map((element) => {
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
              })
              .join("\n");
            contentTPEM = contentTPEM ? contentTPEM : "";
            let contentTPP = tPatientPayment.rows
              .map((element) => {
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
              })
              .join("\n");

            let contentTHAS = tHistoryApproveSample.rows
              .map((element) => {
                // console.log("ADA", contentTPR);
                if (!element) {
                  return "";
                }

                element.created_at = `'${new Date(element.created_at).toISOString()}'`;
                element.updated_at = `'${new Date(element.updated_at).toISOString()}'`;
                element.acc_date = `'${new Date(element.acc_date).toISOString()}'`;

                element.mrn = element.mrn ? `'${element.mrn}'` : element.mrn;
                element.uid = element.uid ? `'${element.uid}'` : element.uid;
                element.reg_num = element.reg_num ? `'${element.reg_num}'` : element.reg_num;
                element.uid_acc_by = element.uid_acc_by ? `'${element.uid_acc_by}'` : element.uid_acc_by;
                element.uid_profile = element.uid_profile ? `'${element.uid_profile}'` : element.uid_profile;
                element.uid_object = element.uid_object ? `'${element.uid_object}'` : element.uid_object;

                return "INSERT INTO t_history_approve_sample (mrn, reg_num, acc_date, uid, uid_acc_by, enabled, uid_profile, uid_object, created_at, updated_at) VALUES(" + element.mrn + ", " + element.reg_num + ", " + element.acc_date + ", " + element.uid + ", " + element.uid_acc_by + ", " + element.enabled + ", " + element.uid_profile + ", " + element.uid_object + ", " + element.created_at + ", " + element.updated_at + ");" + "\n";
              })
              .join("\n");
            contentTHAS = contentTHAS ? contentTHAS : "";
            contentTPP = contentTPP ? contentTPP : "";
            contentTPE = contentTPE.join("");

            contentTPS = contentTPS ? contentTPS : "";
            let contentFull = contentTPR + "\n" + contentTPO + "\n" + contentTPOD + "\n" + contentTPS + "\n" + contentTPSS + "\n" + contentTPE + "\n" + contentTCS + "\n" + contentTPD + "\n" + contentTPEM + "\n" + contentTPP + "\n" + contentTHAS + "\n" + contentTP;
            let newRegNum = element.reg_num.replace(/'/g, "");
            fs.writeFile("./app/manual/" + newRegNum + ".sql", contentFull, (err) => {
              console.log("Writing SQL Manual");

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
    console.log("Manual selesai");
  } catch (error) {
    console.error("Error executing queries:", error);
  }
}

async function main(params) {
  await bridging(startDate, endDate);
  console.log("SELESAI BRIDING");
  await manual(startDate, endDate);
  console.log("SELESAI SEMUA");
}
main();
// Other routes and middleware...
// bridging(startDate, endDate);
// manual(startDate, endDate);

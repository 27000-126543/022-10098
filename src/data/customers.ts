export interface Customer {
  id: string;
  name: string;
  phone: string;
  idCardLast4: string;
  appointmentId: string;
  appointmentDate: string;
  doctor: string;
}

const today = "2026-06-22";

export const customers: Customer[] = [
  {
    id: "CUST001",
    name: "王美丽",
    phone: "138****5678",
    idCardLast4: "1234",
    appointmentId: "APT20260622001",
    appointmentDate: today,
    doctor: "张医生",
  },
  {
    id: "CUST002",
    name: "李芳华",
    phone: "139****2345",
    idCardLast4: "5678",
    appointmentId: "APT20260622002",
    appointmentDate: today,
    doctor: "李医生",
  },
  {
    id: "CUST003",
    name: "陈雅婷",
    phone: "137****8901",
    idCardLast4: "9012",
    appointmentId: "APT20260622003",
    appointmentDate: today,
    doctor: "王医生",
  },
];

export default customers;

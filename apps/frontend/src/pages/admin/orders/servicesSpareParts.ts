/** Service or spare part that can be added to an order budget */
export interface ServiceSparePart {
  id: string;
  name: string;
  price: number;
  amount: number;
}

export const sampleServicesSpareParts: ServiceSparePart[] = [
  { id: '1', name: 'BATTERY', price: 65, amount: 999 },
  { id: '2', name: 'HINGE ON BOTH SIDES', price: 50, amount: 0 },
  { id: '3', name: 'CHARGER', price: 20, amount: 999 },
  { id: '4', name: 'DAMAGE DIAGNOSIS', price: 15, amount: 0 },
  { id: '5', name: 'PC ASSEMBLY', price: 40, amount: 0 },
  { id: '6', name: 'POWER SOURCE', price: 20, amount: 30 },
  { id: '7', name: 'INSTALLING WINDOWS AND UTILITIES', price: 25, amount: 0 },
  { id: '8', name: 'MAINBOARD', price: 70, amount: 100 },
  { id: '9', name: 'PHYSICAL MAINTENANCE, PASTE REPLACEMENT AND PC CLEANING', price: 25, amount: 0 },
  { id: '10', name: 'RAM MEMORY', price: 35, amount: 100 },
  { id: '11', name: 'SCREEN', price: 80, amount: 15 },
  { id: '12', name: 'KEYBOARD', price: 25, amount: 50 },
  { id: '13', name: 'HDD', price: 45, amount: 40 },
  { id: '14', name: 'SOFTWARE INSTALLATION', price: 20, amount: 0 },
  { id: '15', name: 'FAN COOLING', price: 30, amount: 25 },
  { id: '16', name: 'TOUCHPAD', price: 40, amount: 10 },
  { id: '17', name: 'WEBCAM', price: 15, amount: 0 },
  { id: '18', name: 'CABLE SET', price: 10, amount: 200 },
  { id: '19', name: 'GENERAL DIAGNOSIS', price: 15, amount: 0 },
];

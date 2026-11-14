export interface Address {
  country: string;
  postalCode: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
}

export const viennaAddress: Address = {
  country: 'Austria',
  postalCode: '1010',
  houseNumber: '98',
  street: 'Test street',
  city: 'Vienna',
  state: 'Vienna',
};

export const COUPON_TYPES = ['Percentage', 'Flat Discount', 'BOGO']

export const INITIAL_COUPONS = [
  {
    id: 1,
    name: 'Coupon 1',
    type: 'Percentage',
    redemptions: 1450,
    expiresOn: '26/06/2026',
    status: 'Active',
    topPerforming: true,
  },
  {
    id: 2,
    name: 'Coupon 2',
    type: 'Flat Discount',
    redemptions: 980,
    expiresOn: '15/08/2026',
    status: 'Active',
    topPerforming: false,
  },
  {
    id: 3,
    name: 'Coupon 3',
    type: 'BOGO',
    redemptions: 420,
    expiresOn: '01/12/2026',
    status: 'Active',
    topPerforming: true,
  },
  {
    id: 4,
    name: 'Coupon 4',
    type: 'Percentage',
    redemptions: 210,
    expiresOn: '10/03/2026',
    status: 'In Active',
    topPerforming: false,
  },
]

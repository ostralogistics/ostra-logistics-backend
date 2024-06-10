export enum ParcelStatus {
    PENDING ="pending",
    DELIVERED ="delivered",
    ENROUTE ="enroute"
}

export enum BidStatus {
    DECLINED ="declined",
    ACCEPTED ="accepted",
    COUNTERED ="countered",
    PENDING ="pending",
    BID_PLACED ="bid_placed"

}



export enum AcceptOrDeclineTask{
    DECLINE ="decline",
    ACCEPT ="accept"
}

export enum TaskStatus{
    ONGOING="ongoing",
    CONCLUDED ="concluded"
}

export enum RiderTask{
    PICKUP ="pickup",
    DROPOFF ="dropoff",
    PICKUP_AND_DROPOFF ="pickup and dropoff"
}


export enum RiderMileStones{
    ENROUTE_TO_PICKUP_LOCATION= "enroute_to_pickup_location",
    AT_PICKUP_LOCATION ="at_pickup_location",
    PICKED_UP_PARCEL ="picked_up_parcel",
    ENROUTE_TO_THE_OFFICE_FOR_REBRANDING= "enroute_to_office_for_rebranding",
    AT_THE_OFFICE_FOR_REBRANDING ="at_the_office_for_rebranding",
    ENROUTE_TO_DROPOFF_LOCATION= "enroute_to_dropoff_location",
    AT_DROPOFF_LOCATION ="at_dropoff_location",
    DROPPED_OFF_PARCEL ="dropped_off-parcel",

}

export enum complainResolutionStatus{
    RESOLVED="resolved",
    ON_HOLD="on_hold",
    IN_PROGRESS ="in_progress"

}

export enum channelforconversation{
    CLOSE="close",
    OPEN="open"
}


export enum BiddingAction {
    DECLINE ="decline",
    ACCEPT ="accept",
    COUNTER ="counter",
    
}

export enum TransactionType{
    ORDER_PAYMENT ="order_payment",
    SALARY_PAYMENT ="salary_payment"
}

export enum BankDetailsStatus{
    PRIMARY ="primary",
    SECONDARY="secondary"
}


export enum BidEvent {
    ACCEPTED = 'BID_ACCEPTED',
    DECLINED = 'BID_DECLINED',
    COUNTERED = 'BID_COUNTERED',
    BID_INITIATED ="BID_INITIATED"
  }
  


export enum RidersApprovalStatus{
    APPROVED ="approved",
    BEING_REVIEWED ="being_reviewed",
    DENIED ="denied"
}

export enum Role{
    RIDER ="rider",
    ADMIN="admin",
    CUSTOMER ="customer",

}

export enum AdminType{
    CEO ="ceo",
    STAFF ="staff"

}

export enum ReturnedVehicle{
    YES="yes",
    NOT_YET ="not_yet"
}
export enum AdminAccessLevels{
    LEVEL1="level_1",
    LEVEL2 ="level_2",
    LEVEL3 ="level_3"
}

export enum VehicleType{
    BIKE="bike",
    TRUCK="truck",
    VAN="van",
    CAR="car"
}

export enum PaymentStatus{
    SUCCESSFUL ="successful",
    FAILED ="failed",
    PENDING ="pending"
}

export enum RequestType{
    PASSWORD_RESET= "password reset",
    PROFILE_CORRECTION="password correction",
    BANK_DETAILS_CHANGE ="bank details change"
}



export enum OrderStatus{
    BIDDING_ONGOING ="bidding_ongoing",
    ENROUTE_TO_PICKUP ="enroute_to_pick_up",
    PARCEL_REBRANDING ="parcel_rebranding",
    PICKED_UP ="picked_up",
    IN_TRANSIT = "in_transit",
    DROPPED_OFF ="dropped_off"
}

export enum VehicleState{
    GOOD_TO_GO = "good_to_go",
    NEEDS_REPAIRS = "needs_repairs", 
    UNDER_MAINTAINENCE ="under_maintainence",
    VERY_BAD = "very_bad"
}

export enum VehicleAssignedStatus{
    ASSIGNED ="Assigned",
    UNASSIGNED='Unassigned'
}

export enum DeliveryPriority{
    IMMEDIATELY = "immediately",
    LATER_TODAY = "later_today",
    LATER_DURING_THE_WEEK ="later_during_the week"
    
}

export enum RiderStatus{
    AVAILABLE ="Available",
    OFFLINE ="Offline",
    IN_TRANSIT = "In_transit"
}

export enum PriorityDeliveryType{
    EXPRESS_DELIVERY ="Express_Delivery",
    SAME_DAY_DELIVERY ="same_day_delivery",
    SCHEDULED_DELIVERY ="scheduled_delivery"
}

export enum Gender {
    Male = 'male',
    Female = 'female',
    Genderfluid = 'genderfluid',
    Genderqueer = 'genderqueer',
    Cisgender = 'cisgender',
    Rather_not_say = 'rather_not_say',
  }

  export enum MaritalStatus{
    MARRIED ="Married",
    NOT_MARRIED ="Not married"
  }


  export enum StateOFOrigin{
    Abia = "Abia",
    Adamawa = "Adamawa",
    AkwaIbom = "Akwa Ibom",
    Anambra = "Anambra",
    Bauchi = "Bauchi",
    Bayelsa = "Bayelsa",
    Benue = "Benue",
    Borno = "Borno",
    CrossRiver = "Cross River",
    Delta = "Delta",
    Ebonyi = "Ebonyi",
    Edo = "Edo",
    Ekiti = "Ekiti",
    Enugu = "Enugu",
    Gombe = "Gombe",
    Imo = "Imo",
    Jigawa = "Jigawa",
    Kaduna = "Kaduna",
    Kano = "Kano",
    Katsina = "Katsina",
    Kebbi = "Kebbi",
    Kogi = "Kogi",
    Kwara = "Kwara",
    Lagos = "Lagos",
    Nasarawa = "Nasarawa",
    Niger = "Niger",
    Ogun = "Ogun",
    Ondo = "Ondo",
    Osun = "Osun",
    Oyo = "Oyo",
    Plateau = "Plateau",
    Rivers = "Rivers",
    Sokoto = "Sokoto",
    Taraba = "Taraba",
    Yobe = "Yobe",
    Zamfara = "Zamfara",
    FCT = "Federal Capital Territory"
}

export enum NotificationType {
    CUSTOMER_REGISTERED = 'customer_registered',
    CUSTOMER_LOGGED_IN = 'customer_logged_in',
    CUSTOMER_DELETED = 'customer_deleted',
    CUSTOMER_PASSWORD_CHANGED = 'customer_password_changed',

    RIDER_REGISTERED = 'rider_registered',
    RIDER_LOGGED_IN = 'rider_logged_in',
    RIDER_DELETED = 'rider_deleted',
    RIDER_PASSWORD_CHANGED = 'rider_password_changed',
    RIDER_ACCEPTED_AN_ORDER ="rider_accepted_an_order",
    RIDER_INFO_UPDATED = "",

    EMAIL_VERIFICATION = 'email_verification',

    BLOGPOST_CREATED = 'blogpost_created',
    BLOGPOST_EDITED = 'blogpost_edited',
    BLOGPOST_DELETED = 'blogpost_deleted',

    ADMIN_CREATED = 'admin_created',
    ADMIN_PASSWORD_CHANGED = 'admin_password_changed',
    ADMIN_DELETED ="admin_deleted",
   
    LOGGED_IN = 'logged_in',
  }

export enum OrderBasedOnDates{
    TODAY="today",
    LAST_WEEK="lastweek",
    LAST_MONTH="lastmonth",
    LAST_YEAR="lastyear"
}

export enum DeliveryVolume{
    WEEk="week",
    DAY ="day",
    MONTH="month",
   
}







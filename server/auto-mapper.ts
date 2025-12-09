type SystemField = 
  | 'bookingRef' | 'guestName' | 'guestCountry'
  | 'arrivalDate' | 'departureDate' | 'bookingDate'
  | 'roomType' | 'roomNumber' | 'adults' | 'children'
  | 'totalAmount' | 'adr' | 'depositType'
  | 'channel' | 'marketSegment' | 'bookingStatus'
  | 'leadTime' | 'lengthOfStay' | 'isRepeatedGuest' | 'previousBookings';

interface FieldAlias {
  field: SystemField;
  aliases: string[];
  required: boolean;
}

const fieldAliases: FieldAlias[] = [
  {
    field: 'bookingRef',
    aliases: [
      'booking ref', 'booking reference', 'bookingref', 'bookingreference',
      'reservation', 'reservation number', 'reservationnumber', 'reservationno',
      'confirmation', 'confirmation number', 'confirmationnumber',
      'ref', 'reference', 'booking id', 'bookingid', 'id', 'booking no',
      'folio', 'folio number', 'foliono', 'booking_ref', 'booking_reference',
      'reservation_number', 'confirmation_number', 'pms id', 'pmsid'
    ],
    required: true
  },
  {
    field: 'guestName',
    aliases: [
      'guest name', 'guestname', 'guest', 'name', 'customer name', 'customername',
      'customer', 'full name', 'fullname', 'client name', 'clientname', 'client',
      'guest full name', 'primary guest', 'primaryguest', 'lead guest', 'leadguest',
      'guest_name', 'customer_name', 'full_name', 'booker name', 'bookername'
    ],
    required: false
  },
  {
    field: 'guestCountry',
    aliases: [
      'guest country', 'guestcountry', 'country', 'nationality', 'country of origin',
      'countryoforigin', 'origin country', 'origincountry', 'guest nationality',
      'guestnationality', 'country code', 'countrycode', 'guest_country',
      'country_of_origin', 'origin_country', 'nation', 'residence country'
    ],
    required: false
  },
  {
    field: 'arrivalDate',
    aliases: [
      'arrival date', 'arrivaldate', 'arrival', 'check in', 'checkin', 'check-in',
      'check in date', 'checkindate', 'check-in date', 'start date', 'startdate',
      'from date', 'fromdate', 'arrival_date', 'check_in', 'check_in_date',
      'start_date', 'from_date', 'in date', 'indate', 'arrive', 'arrive date',
      'reservation start', 'reservationstart', 'stay start', 'staystart'
    ],
    required: true
  },
  {
    field: 'departureDate',
    aliases: [
      'departure date', 'departuredate', 'departure', 'check out', 'checkout', 'check-out',
      'check out date', 'checkoutdate', 'check-out date', 'end date', 'enddate',
      'to date', 'todate', 'departure_date', 'check_out', 'check_out_date',
      'end_date', 'to_date', 'out date', 'outdate', 'depart', 'depart date',
      'reservation end', 'reservationend', 'stay end', 'stayend', 'leaving date'
    ],
    required: true
  },
  {
    field: 'bookingDate',
    aliases: [
      'booking date', 'bookingdate', 'booked date', 'bookeddate', 'reservation date',
      'reservationdate', 'created date', 'createddate', 'date booked', 'datebooked',
      'booking_date', 'booked_date', 'reservation_date', 'created_date', 'date_booked',
      'created', 'booked on', 'bookedon', 'order date', 'orderdate', 'purchase date'
    ],
    required: false
  },
  {
    field: 'roomType',
    aliases: [
      'room type', 'roomtype', 'room category', 'roomcategory', 'room', 'room class',
      'roomclass', 'assigned room type', 'assignedroomtype', 'reserved room type',
      'reservedroomtype', 'room_type', 'room_category', 'room_class', 'category',
      'accommodation type', 'accommodationtype', 'unit type', 'unittype',
      'room description', 'roomdescription', 'room name', 'roomname'
    ],
    required: false
  },
  {
    field: 'roomNumber',
    aliases: [
      'room number', 'roomnumber', 'room no', 'roomno', 'room num', 'roomnum',
      'room #', 'room_number', 'room_no', 'room_num', 'assigned room', 'assignedroom',
      'room id', 'roomid', 'unit number', 'unitnumber', 'unit no', 'unitno'
    ],
    required: false
  },
  {
    field: 'adults',
    aliases: [
      'adults', 'adult', 'no of adults', 'noofadults', 'number of adults', 'numberofadults',
      'adult count', 'adultcount', 'adults count', 'adultscount', 'num adults', 'numadults',
      'no_of_adults', 'number_of_adults', 'adult_count', 'adults_count', 'num_adults',
      'adult guests', 'adultguests', 'adult_guests', 'pax adults', 'paxadults'
    ],
    required: false
  },
  {
    field: 'children',
    aliases: [
      'children', 'child', 'kids', 'no of children', 'noofchildren', 'number of children',
      'numberofchildren', 'children count', 'childrencount', 'child count', 'childcount',
      'num children', 'numchildren', 'no_of_children', 'number_of_children',
      'children_count', 'child_count', 'num_children', 'kid count', 'kidcount',
      'minors', 'pax children', 'paxchildren'
    ],
    required: false
  },
  {
    field: 'totalAmount',
    aliases: [
      'total amount', 'totalamount', 'total', 'amount', 'revenue', 'total revenue',
      'totalrevenue', 'price', 'total price', 'totalprice', 'booking amount',
      'bookingamount', 'room revenue', 'roomrevenue', 'total_amount', 'total_revenue',
      'total_price', 'booking_amount', 'room_revenue', 'gross amount', 'grossamount',
      'net amount', 'netamount', 'charge', 'total charge', 'totalcharge', 'cost',
      'room rate', 'roomrate', 'stay amount', 'stayamount', 'booking value', 'value'
    ],
    required: true
  },
  {
    field: 'adr',
    aliases: [
      'adr', 'average daily rate', 'averagedailyrate', 'daily rate', 'dailyrate',
      'rate', 'room rate', 'roomrate', 'avg rate', 'avgrate', 'average rate',
      'averagerate', 'average_daily_rate', 'daily_rate', 'room_rate', 'avg_rate',
      'average_rate', 'nightly rate', 'nightlyrate', 'nightly_rate', 'per night',
      'pernight', 'per_night', 'rate per night', 'ratepernight'
    ],
    required: false
  },
  {
    field: 'depositType',
    aliases: [
      'deposit type', 'deposittype', 'deposit', 'payment type', 'paymenttype',
      'payment method', 'paymentmethod', 'deposit_type', 'payment_type',
      'payment_method', 'pay type', 'paytype', 'pay_type', 'payment status',
      'paymentstatus', 'payment_status', 'prepayment', 'pre payment', 'pre-payment'
    ],
    required: false
  },
  {
    field: 'channel',
    aliases: [
      'channel', 'distribution channel', 'distributionchannel', 'booking channel',
      'bookingchannel', 'source', 'booking source', 'bookingsource', 'origin',
      'booking origin', 'bookingorigin', 'distribution_channel', 'booking_channel',
      'booking_source', 'booking_origin', 'market channel', 'marketchannel',
      'sales channel', 'saleschannel', 'ota', 'agent', 'travel agent', 'travelagent',
      'distribution', 'acquisition channel', 'acquisitionchannel'
    ],
    required: true
  },
  {
    field: 'marketSegment',
    aliases: [
      'market segment', 'marketsegment', 'segment', 'market', 'customer segment',
      'customersegment', 'guest segment', 'guestsegment', 'market_segment',
      'customer_segment', 'guest_segment', 'traveler type', 'travelertype',
      'traveler_type', 'guest type', 'guesttype', 'guest_type', 'customer type',
      'customertype', 'customer_type', 'business type', 'businesstype'
    ],
    required: false
  },
  {
    field: 'bookingStatus',
    aliases: [
      'booking status', 'bookingstatus', 'status', 'reservation status',
      'reservationstatus', 'booking_status', 'reservation_status', 'state',
      'booking state', 'bookingstate', 'booking_state', 'cancelled', 'canceled',
      'is cancelled', 'iscancelled', 'is canceled', 'iscanceled', 'is_cancelled',
      'is_canceled', 'confirmation status', 'confirmationstatus'
    ],
    required: true
  },
  {
    field: 'leadTime',
    aliases: [
      'lead time', 'leadtime', 'lead_time', 'days in advance', 'daysinadvance',
      'days_in_advance', 'advance days', 'advancedays', 'advance_days',
      'booking lead time', 'bookingleadtime', 'booking_lead_time',
      'days before arrival', 'daysbeforearrival', 'days_before_arrival'
    ],
    required: false
  },
  {
    field: 'lengthOfStay',
    aliases: [
      'length of stay', 'lengthofstay', 'length_of_stay', 'los', 'stay length',
      'staylength', 'stay_length', 'nights', 'number of nights', 'numberofnights',
      'number_of_nights', 'no of nights', 'noofnights', 'no_of_nights', 'duration',
      'stay duration', 'stayduration', 'stay_duration', 'total nights', 'totalnights',
      'total_nights', 'room nights', 'roomnights', 'room_nights'
    ],
    required: false
  },
  {
    field: 'isRepeatedGuest',
    aliases: [
      'is repeated guest', 'isrepeatedguest', 'is_repeated_guest', 'repeated guest',
      'repeatedguest', 'repeated_guest', 'repeat guest', 'repeatguest', 'repeat_guest',
      'returning guest', 'returningguest', 'returning_guest', 'is repeat',
      'isrepeat', 'is_repeat', 'loyal guest', 'loyalguest', 'loyal_guest',
      'previous guest', 'previousguest', 'previous_guest', 'is returning',
      'isreturning', 'is_returning'
    ],
    required: false
  },
  {
    field: 'previousBookings',
    aliases: [
      'previous bookings', 'previousbookings', 'previous_bookings',
      'past bookings', 'pastbookings', 'past_bookings', 'prior bookings',
      'priorbookings', 'prior_bookings', 'previous stays', 'previousstays',
      'previous_stays', 'past stays', 'paststays', 'past_stays',
      'number of previous bookings', 'numberofpreviousbookings',
      'number_of_previous_bookings', 'booking history', 'bookinghistory',
      'booking_history', 'stay count', 'staycount', 'stay_count'
    ],
    required: false
  }
];

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_\-\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1.0;
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchingWords = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || (w1.length > 3 && w2.length > 3 && (w1.includes(w2) || w2.includes(w1)))) {
        matchingWords++;
        break;
      }
    }
  }
  
  const totalWords = Math.max(words1.length, words2.length);
  return matchingWords / totalWords;
}

export interface MappingResult {
  columnMapping: Record<string, string>;
  confidence: number;
  unmappedHeaders: string[];
  missingRequired: string[];
  mappingDetails: { header: string; field: string; confidence: number }[];
}

export function autoMapColumns(headers: string[]): MappingResult {
  const columnMapping: Record<string, string> = {};
  const mappingDetails: { header: string; field: string; confidence: number }[] = [];
  const unmappedHeaders: string[] = [];
  const usedFields = new Set<string>();
  
  for (const header of headers) {
    const normalizedHeader = normalizeHeader(header);
    let bestMatch: { field: SystemField; score: number } | null = null;
    
    for (const fieldDef of fieldAliases) {
      if (usedFields.has(fieldDef.field)) continue;
      
      for (const alias of fieldDef.aliases) {
        const normalizedAlias = normalizeHeader(alias);
        
        if (normalizedHeader === normalizedAlias) {
          bestMatch = { field: fieldDef.field, score: 1.0 };
          break;
        }
        
        if (normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader)) {
          const score = 0.9;
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { field: fieldDef.field, score };
          }
        }
        
        const similarity = calculateSimilarity(normalizedHeader, normalizedAlias);
        if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.score)) {
          bestMatch = { field: fieldDef.field, score: similarity };
        }
      }
      
      if (bestMatch?.score === 1.0) break;
    }
    
    if (bestMatch && bestMatch.score >= 0.7) {
      columnMapping[bestMatch.field] = header;
      usedFields.add(bestMatch.field);
      mappingDetails.push({ header, field: bestMatch.field, confidence: bestMatch.score });
    } else {
      unmappedHeaders.push(header);
    }
  }
  
  const requiredFields = fieldAliases.filter(f => f.required).map(f => f.field);
  const missingRequired = requiredFields.filter(f => !usedFields.has(f));
  
  const mappedConfidences = mappingDetails.map(m => m.confidence);
  const avgConfidence = mappedConfidences.length > 0 
    ? mappedConfidences.reduce((a, b) => a + b, 0) / mappedConfidences.length 
    : 0;
  
  const requiredMappedCount = requiredFields.filter(f => usedFields.has(f)).length;
  const requiredScore = requiredMappedCount / requiredFields.length;
  
  const overallConfidence = (avgConfidence * 0.6 + requiredScore * 0.4);
  
  return {
    columnMapping,
    confidence: overallConfidence,
    unmappedHeaders,
    missingRequired,
    mappingDetails
  };
}

export function getRequiredFields(): string[] {
  return fieldAliases.filter(f => f.required).map(f => f.field);
}

export function getAllFields(): string[] {
  return fieldAliases.map(f => f.field);
}

const UOM_FACTORS = {
  wh: 1.0,
  kwh: 1000.0,
  mwh: 1000000.0,
  gwh: 1000000000.0,
  twh: 1000000000000.0,
  kg: 1.0,
  t: 1000.0,
  ton: 1000.0,
  tons: 1000.0,
  g: 0.001,
  kt: 1000000.0,
  mt: 1000000000.0,
  pg: 1000000000.0,
  gt: 1000000000000.0,
};

exports.get_uom_factor = function(uom) {
  if (uom) {
    let uoml = uom.toLowerCase();
    let f = UOM_FACTORS[uoml];
    if (f) return f;
  }
  throw new Error("Unknown UOM [" + uom + "]");
};

exports.get_year_from_date = function(date) {
  var year = null;
  if (typeof date === "number") {
    year = date;
  } else if (date.length) {
    // for YYYY-mm-dd or YYYY-dd-mm or YYYY/mm/dd ...
    var r = /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/;
    // for reverse: mm-dd-YYYY
    var r2 = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/;
    if (r.test(date)) {
      year = date.substring(0, 4);
    } else if (r2.test(date)) {
      year = date.substring(date.length - 4);
    } else {
      year = Number(date);
    }
  }
  return year;
};

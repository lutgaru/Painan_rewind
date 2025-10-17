function str2cint(hex:string){
    if (hex.length % 2 != 0) {
        hex = "0" + hex;
    }
    var num = parseInt(hex, 16);
    var maxVal = Math.pow(2, hex.length / 2 * 8);
    if (num > maxVal / 2 - 1) {
        num = num - maxVal
    }
    return num;
}

function decoder_short_beacon(frame: String){
    let header=32
    return {'RxC':parseInt(frame.substring(header,header+4),16),
    'RSSI':parseInt(frame.substring(header+4,header+8),16)*(3/4096), 
    'SMPST': str2cint(frame.substring(header+8,header+10)),
    'PAT': str2cint(frame.substring(header+10,header+12)),
    'C3V3':str2cint(frame.substring(header+12,header+16))*3*Math.pow(10,-6),
    'V3V3':str2cint(frame.substring(header+16,header+20))*4*Math.pow(10,-3),
    'C5V':str2cint(frame.substring(header+20,header+24))*62*Math.pow(10,-6),
    'V5V':str2cint(frame.substring(header+24,header+28))*4*Math.pow(10,-3),}    
}

function decoder_large_beacon(frame :string){
    let header=32
    return {'ID':frame.substring(header,header+4),
    'Length':parseInt(frame.substring(header+4,header+6),16), 
    'Antenna': parseInt(frame.substring(header+6,header+8)),
    'PanTemp1':str2cint(frame.substring(header+8,header+12))*(6.25/800),
    'PanTemp2':str2cint(frame.substring(header+12,header+16))*(6.25/800),
    'PanTemp3':str2cint(frame.substring(header+16,header+20))*(6.25/800),
    'BankTemp1':str2cint(frame.substring(header+20,header+24))*(6.25/800),
    'BankTemp2':str2cint(frame.substring(header+24,header+28))*(6.25/800),
    'BankChar1':str2cint(frame.substring(header+28,header+32)),
    'BankChar2':str2cint(frame.substring(header+32,header+36)),
    /*qint16 z_1 = hexdata.mid(44,2).toInt(&ok,16);
        qint16 z_2 = hexdata.mid(46,2).toInt(&ok,16)<<8;
        qint16 z = (z_1 | z_2);*/
    'GyroX':str2cint(frame.substring(header+36,header+40)),
    'GyroY':str2cint(frame.substring(header+40,header+44)),
    'GyroZ':str2cint(frame.substring(header+44,header+48)),
    /*int estByte = hexdata.mid(48,2).toInt(&ok,16);
        if(CHECK_BIT(estByte, 6))
        {
            qInfo() << "GPS is on.";
        }
        else if(!CHECK_BIT(estByte, 6))
        {
            qInfo() << "GPS is off.";
        } */
    'Status':frame.substring(header+48,header+50),
    'Restarts':str2cint(frame.substring(header+50,header+54)),
    'RTC':frame.substring(header+54,header+66),
    'BankVolt1':parseInt(frame.substring(header+66,header+70),16),
    'BankVolt2':parseInt(frame.substring(header+70,header+74),16),
    'BankCurr1':parseInt(frame.substring(header+74,header+78),16),
    'BankCurr2':parseInt(frame.substring(header+78,header+82),16),
    'GPSstat':parseInt(frame.substring(header+82,header+84),16)===7?'fix':'no fix',
    '3V3volts':parseInt(frame.substring(header+84,header+88),16),
    'BATvolts':parseInt(frame.substring(header+88,header+92),16),
    'LNAvolts':parseInt(frame.substring(header+92,header+96),16),
    '5Vvolts':parseInt(frame.substring(header+96,header+100),16),
    'GPSvolts':parseInt(frame.substring(header+100,header+104),16),
    'CAMvolts':parseInt(frame.substring(header+104,header+108),16),}    
}
export { decoder_large_beacon, decoder_short_beacon}
import React from 'react'
import moment from 'moment'
var BS = require('react-bootstrap');
import { Button } from 'react-bootstrap';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import {List, ListItem} from 'material-ui/List';
import TextField from 'material-ui/TextField';
import Dialog from 'material-ui/Dialog';
import CircularProgress from 'material-ui/CircularProgress';
var _ = require('underscore');
var DateRangePicker = require('react-bootstrap-daterangepicker');
import RaisedButton from 'material-ui/RaisedButton';
import Snackbar from 'material-ui/Snackbar';
import Checkbox from 'material-ui/Checkbox';
import SelectField from 'material-ui/SelectField';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import FileFileDownload from 'material-ui/svg-icons/file/file-download';
import fetchIntercept from 'fetch-intercept';
let zone, allZones, retrievedZones,
    dateCount = 0,
    isLoadedResults = true;


class GeotabPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'This week': [moment().startOf('isoWeek'), moment().endOf('isoWeek')],
                'Last week': [moment().startOf('isoWeek').subtract(7, 'days'), moment().endOf('isoWeek').subtract(7, 'days')],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
            startDate: moment().startOf('isoWeek'),
            endDate: moment().endOf('isoWeek'),
            startDateOriginal: moment().startOf('isoWeek'),
            users: [],
            devices: [],
            usersMap: {},
            devicesMap: {},
            trips: null,
            usersLoaded: false,
            createdReport: false,
            openSettings: false,
            weekHours: '44',
            dayHours: '8',
            officeZone: '',
            mileRate: '0',
            milesMinimum: '0',
            driverName: '',
            lunchTime: '30',
            weekEmails: '',
            dayEmails: '',
            selectedUserIds: [],
            excelTrips: [],
            openSnackbar: false,
            settingsId: '',
            openMap:false,
            isExcel: false,
            tripsIsLoaded: false,
            isRenderedData: false,
            showLoader: false,
            groups: [],
            zones: [],
            zone: null,
            info: [],
            mapInfo: [],
            customerZones: [],
            promises: [],
            groupsMap: {},
            setToDefault: true
        };
        this.reportName = 'timeCard'

        $.ajax({
            type: "GET",
            url: `https://nginx.zenduit.com:3177/reports/db/${timeCard.cred.database}`,
            contentType: "application/json",
            dataType: 'json',
            success: (data)=> {
                // console.log(data);
                const settings = data.filter(arr => {
                    if (arr.reportName && arr.reportName === this.reportName) return true
                });
                if (settings.length) {
                    zone = settings[0].options.officeZone
                }

            }

        });

        timeCard.api.call("Get", { typeName: "Zone"})
            .then( data => {
                let zonesArr = [];
                for (let i = 0; i < data.length; i++) {
                    // if (data[i].zoneTypes.length > 0) {
                    // for (let m = 0; m < data[i].zoneTypes.length; m++) {
                    if (data[i].zoneTypes.length > 0 && (typeof data[i].zoneTypes[0] === 'string'
                        && data[i].zoneTypes[0] === 'ZoneTypeCustomerId')) {
                        zonesArr.push(data[i].id);
                    }
                    // }
                    // }
                }
                this.setState({customerZones: zonesArr})
            });

        Number.prototype.formatMoney = function(places, symbol, thousand, decimal) {
            places = !isNaN(places = Math.abs(places)) ? places : 2;
            symbol = symbol !== undefined ? symbol : "";
            thousand = thousand || ",";
            decimal = decimal || ".";
            var number = this,
                negative = number < 0 ? "-" : "",
                i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "",
                j = (j = i.length) > 3 ? j % 3 : 0;
            return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "1" + thousand) + (places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : "");
        };

        const self = this;
        setTimeout(() => {
            this.getSettings();
            $('select[multiple]').multiselect({
                selectAll: true,
                search: true,
                selectAllCheckBoxes: this.selectAllCheckBoxes,
                deselectAllCheckBoxes: this.deselectAllCheckBoxes
            }).on("change", function(evt){

                var val = $(this).val();
                self.setState({selectedUserIds: val});
                self.makeReport(true);

                // let changeSelectOptions = setInterval(() => {
                //     if (self.state.tripsIsLoaded) {
                //
                //         // self.getStartData(self.props.groups, true, false);
                //         clearInterval(changeSelectOptions);
                //     }
                // }, 2000);
            });

            $('.ms-options').find('ul').find('li input').keyup(function(event) {
                if(event.which === 32) {
                    event.preventDefault();
                }
            });

            this.getAllZones()
            // self.getStartData(self.props.groups, false, true);
            self.setState({isRenderedData: true});

        }, 1000)
    }
    componentDidMount(){

    };

    selectAllCheckBoxes = () => {
        $('.ms-options').find('ul').find('li input').prop('checked', true);
        var val = $('select[multiple]').val();
        this.setState({selectedUserIds: val});
        this.makeReport(true);
    }
    deselectAllCheckBoxes = () => {
        $('.ms-options').find('ul').find('li input').prop('checked', false);
        var val = $('select[multiple]').val();
        this.setState({selectedUserIds: val});
        this.makeReport(true);
    }

    componentWillReceiveProps(nextProps){
        console.log('componentWillReceiveProps');
        // this.getAllZones()
        // this.getStartData(nextProps.groups, false, false)
    };

    componentDidUpdate(prevProps, prevState){
        if (prevState.startDate.toISOString() != this.state.startDate.toISOString() ||
            prevState.endDate.toISOString() != this.state.endDate.toISOString()){
            console.log('componentDidUpdate');
            this.makeReport(false)
            // this.getStartData(this.state.groups, false, false)
        }
    };

    createMap = (day) => {
        this.setState({mapInfo: []});
        const calls = [];

        var LeafIcon = L.Icon.extend({
            options: {
                number: '',
                shadowUrl: null,
                iconSize: new L.Point(40, 40),
                iconAnchor: new L.Point(13, 41),
                popupAnchor: new L.Point(0, -33),
                /*
                 iconAnchor: (Point)
                 popupAnchor: (Point)
                 */
                className: 'leaflet-div-icon'
            },

            createIcon: function () {
                var div = document.createElement('div');
                var img = this._createImg(this.options['iconUrl']);
                var numdiv = document.createElement('div');
                var bgWhite = document.createElement('div');
                numdiv.setAttribute ( "class", "number" );
                bgWhite.setAttribute ( "class", "bg-white" );
                numdiv.innerHTML = this.options['number'] || '';
                div.appendChild ( img );
                div.appendChild ( numdiv );
                div.appendChild ( bgWhite );
                this._setIconStyles(div, 'icon');
                return div;
            },

            //you could change this to add a shadow like in the normal marker if you really wanted
            createShadow: function () {
                return null;
            }
        });


        day.driverChanges.forEach(change => {
            let toDate = moment(change.dateTime).add(60, 'minutes').toISOString();
            let query = {
                typeName: 'LogRecord',
                search: {
                    fromDate: change.dateTime,
                    toDate: toDate,
                    deviceSearch: {
                        id: change.device.id
                    }
                },
                resultsLimit: 1
            };
            calls.push(["Get", query])
        });
        timeCard.api.multiCall(calls).
        then(res=>{
            this.setState({openMap:true})
            setTimeout(() => {
                let text = '';
                let self = this;
                let baseLayer = L.tileLayer("https://{s}.tiles.mapbox.com/v3/geotab.i8d8afbp/{z}/{x}/{y}.png");

                self.map = new L.Map("keymap", {
                    center: new L.LatLng(43.434497, -79.709441),
                    zoom: 9,
                    layers: [baseLayer]
                });
                let textArray = [];
                for (let i = 0; i < res.length; i++) {
                    if (res[i].length === 0) return;
                    if (res[i].length === 1) res[i] = res[i][0];
                    if ((i + 1) % 2 === 0) {
                        text = `KO-${Math.ceil((i + 1) / 2)} ${moment(res[i].dateTime).format('h:mm:ss A')}`
                    } else {
                        text = `KI-${Math.ceil((i + 1) / 2)} ${moment(res[i].dateTime).format('h:mm:ss A')}`
                    }
                    textArray.push(text);
                    let marker = L.marker([res[i].latitude, res[i].longitude], {
                        icon: new LeafIcon({number: i + 1, iconUrl: 'https://storage.googleapis.com/time-card/map-marker.png'})
                    });
                    // let marker = L.marker([res[i].latitude, res[i].longitude]).bindLabel(text, {noHide: true });
                    // marker.addTo(self.map);
                }
                this.showInfo(day, text, res, self.map, LeafIcon, textArray);
                if (res.length !== 0) {
                    let markers = res.map(change => {
                        if(change.length) change = change[0];
                        return [change.latitude, change.longitude]
                    })
                    const bounds = L.latLngBounds(markers);
                    self.map.fitBounds(bounds);
                }
                $('.map_dialog').children().children().addClass('map_dialog_content');
            },0)

        });
    };

    getSettings = () => {
        this.getZone();
        $.ajax({
            type: "GET",
            url: `https://nginx.zenduit.com:3177/reports/db/${timeCard.cred.database}`,
            contentType: "application/json",
            dataType: 'json',
            success: (data)=> {
                // console.log(data);
                const settings = data.filter(arr => {
                    if (arr.reportName && arr.reportName === this.reportName) return true
                });
                if (settings.length) {
                    this.setState({weekHours: settings[0].options.weekHours,
                        dayHours: settings[0].options.dayHours,
                        lunchTime: settings[0].options.lunchTime,
                        weekEmails: settings[0].sendingPeriod.week.join(';'),
                        dayEmails: settings[0].sendingPeriod.day.join(';'),
                        settingsId : settings[0]._id,
                        setToDefault: settings[0].options.setToDefault,
                        milesMinimum: settings[0].options.milesMinimum,
                        mileRate: settings[0].options.mileRate,
                        officeZone: settings[0].options.officeZone
                    })
                }

            }

        });
    };

    handleEvent = (event, picker) => {
        this.setState({
            startDate: picker.startDate,
            endDate: picker.endDate
        });
        dateCount = 0;
    };

    createTable = () => {
        this.setState({isExcel:true, showLoader: true});
        let promise = new Promise((resolve) => {
            setInterval(() => {
                if (this.state.isExcel){
                    resolve();
                }
            }, 1000)

        });
        promise
            .then(result => {
                let table = $("#table_excel");

                table.table2excel({
                    exclude: ".noExl",
                    name: "TimeCard",
                    fileName: `time-card-${this.state.startDate.format('YYYY-MM-DD')}-${this.state.endDate.format('YYYY-MM-DD')}`
                });

                this.setState({isExcel:false, showLoader: false});
            });
    };

    loadNextDay = () => {
        dateCount = dateCount + 1;
        this.makeReport(false);
    };


    loadPrevDay = () => {
        dateCount = dateCount > 0 ? dateCount - 1 : 0;
        this.makeReport(false);
    };

    getAllZones = () => {
        timeCard.api.call("Get", { typeName: "Zone"})
            .then( Zones => {
                retrievedZones = Zones.filter(item => {
                    return item.zoneTypes.length > 0 && (typeof item.zoneTypes[0] === 'string'  && item.zoneTypes[0] === 'ZoneTypeOfficeId');
                });

                allZones = Zones.reduce((map, obj) => {
                    map[obj.id] = obj
                    return map;
                })
                this.makeReport(false)
            });
    }

    makeReport = (fromChange) => {
        this.setState({showLoader: true, tripsIsLoaded: false});
        let zoneTypeNames = retrievedZones;

        this.setState({createdReport:false, trips: null});


        var users = [], devices = [], usersIds = [], usersForSelect = [], selectedUserIds = [], driverChanges = [];

        var fromDate, startDate



        // TODO: LOGIC FROM BACKEND
        const calls = [['Get', {typeName: 'Device'}],
            ['Get', {typeName: 'User', search: {isDriver: true}}],
            ['Get', {
                typeName: 'DriverChange', search: {
                    fromDate: moment(this.state.startDate).add(dateCount, 'days').toISOString(),
                    toDate: moment(this.state.startDate).add(dateCount, 'days').endOf('day').toISOString()
                }
            }], ['Get', {typeName: 'Group'}]];
        timeCard.api.multiCall(calls)
            .then(res => {
                devices = res[0];
                users = res[1];
                driverChanges = res[2];
                isLoadedResults = true;

                if (driverChanges.length === 0) {
                    isLoadedResults = false;
                    this.setState({isExcel:true, showLoader: false});
                    return;
                }

                var now = new Date();

                users = users.filter(user => {
                    return new Date(user.activeTo) > now
                });

                usersForSelect = users.map(user => {
                    return {
                        name: `${user.firstName} ${user.lastName}`,
                        value: user.id,
                        checked: true
                    }
                });
                usersIds = users.map(user => {
                    return user.id
                });

                if (!fromChange) {
                    selectedUserIds = usersIds;
                    this.setState({selectedUserIds: usersIds})
                    $('select[multiple]').multiselect('loadOptions', usersForSelect);
                } else {
                    selectedUserIds = this.state.selectedUserIds;
                }

                if (selectedUserIds === null) {
                    isLoadedResults = false;
                    this.setState({isExcel:true, showLoader: false});
                    return;
                }

                const usersMap = users.reduce((usersMap, user)=> {
                    usersMap[user.id] = user;
                    return usersMap
                }, {});

                this.setState({groups: res[3]});

                const groupsMap = this.state.groups.reduce((groupsMap,group)=>{
                    groupsMap[group.id] = group;
                    return groupsMap
                } , {});

                const devicesMap = devices.reduce((devicesMap, device)=> {
                    devicesMap[device.id] = device;
                    return devicesMap
                }, {});

                const today = new Date();
                this.setState({devicesMap, usersMap});
                this.setState({groupsMap: groupsMap});

                let driverChangesByDriver = _.groupBy(driverChanges, (driverChange)=> {
                    driverChange.dateString = new Date(driverChange.dateTime).toLocaleDateString();
                    return driverChange.driver.id
                });

                delete driverChangesByDriver.undefined;

                let tempObj = {};
                selectedUserIds.forEach(id => {
                    if (id in driverChangesByDriver) {
                        tempObj[id] = driverChangesByDriver[id]
                    }
                });

                driverChangesByDriver = tempObj;
                for (let key in driverChangesByDriver) {
                    driverChangesByDriver[key] = _.groupBy(driverChangesByDriver[key], (driverChange)=> {
                        driverChange.driver = usersMap[driverChange.driver.id];
                        driverChange.device = devicesMap[driverChange.device.id];
                        driverChange.address = '';
                        driverChange.googleMapsAddress = '';
                        return driverChange.dateString;
                    })
                }
                for (let key in driverChangesByDriver) {
                    for (let k in driverChangesByDriver[key]) {
                        driverChangesByDriver[key][k] = {driverChanges: driverChangesByDriver[key][k]};
                        driverChangesByDriver[key][k].diff = 0;
                        driverChangesByDriver[key][k].logs = 0;
                        driverChangesByDriver[key][k].wrong = false;
                        if (new Date(driverChangesByDriver[key][k].driverChanges[0].dateTime).toDateString() == today.toDateString()) {
                            driverChangesByDriver[key][k].today = true
                        } else driverChangesByDriver[key][k].today = false;
                        let changes = driverChangesByDriver[key][k].driverChanges;
                        for (let i = 0; i < changes.length; i++) {
                            driverChangesByDriver[key][k].logs++;
                            // console.log(driverChangesByDriver[key][k], 'DIFFF');
                            if (i + 1 == changes.length) {
                                driverChangesByDriver[key][k].wrong = true;
                                if (!driverChangesByDriver[key][k].today)
                                    driverChangesByDriver[key][k].diff += moment(changes[i].dateTime).endOf('day') - moment(changes[i].dateTime);
                                i++
                            } else {
                                driverChangesByDriver[key][k].diff += moment(changes[i + 1].dateTime) - moment(changes[i].dateTime);
                                i++
                            }
                        }
                    }
                }

                let resultArray = [];
                for (let key in driverChangesByDriver) {
                    resultArray.push(driverChangesByDriver[key]);
                }
                resultArray = resultArray.map(dayChanges => {
                    let arr = [];
                    for (let key in dayChanges) {
                        arr.push(dayChanges[key]);
                    }
                    return arr;
                });



                let trips = [];
                for (let tripsCount = 0; tripsCount < resultArray.length; tripsCount++) {
                    for (let driverCount = 0; driverCount < resultArray[tripsCount].length; driverCount++) {
                        trips.push(resultArray[tripsCount][driverCount]);
                    }
                }

                // let logRecordCalls = [];
                //
                // for (let i = 0; i < trips.length; i++) {
                //     for (let n = 0; n < trips[i].driverChanges.length; n++) {
                //         let toDate = moment(trips[i].driverChanges[n].dateTime).add(15, 'minutes').toISOString();
                //         let query = {
                //             method: 'Get',
                //             params: {
                //                 typeName: 'LogRecord',
                //                 search: {
                //                     fromDate: trips[i].driverChanges[n].dateTime,
                //                     toDate: toDate,
                //                     deviceSearch: {
                //                         id: trips[i].driverChanges[n].device.id
                //                     }
                //                 },
                //                 resultLimit: 1
                //             }
                //         };
                //         logRecordCalls.push(query)
                //     }
                // }
                //
                // timeCard.api.call('ExecuteMultiCall', {
                //     calls: logRecordCalls
                // })
                //     .then(res => {
                //         console.log(res)
                //         trips.forEach((trip, index) => {
                //             trip.driverChanges((change, index) => {
                //                 trip.logRecords = res[index];
                //             })
                //         })
                //         console.log(trips)
                //     })
                //     .catch(err => {
                //         console.log(err);
                //     })



                let newTrips = [];
                this.setState({createdReport: false, isExcel:true});
                this.recursivlyGetDistance(0, trips[0], trips, newTrips, zoneTypeNames,
                    this.getDistance(trips[0], newTrips, zoneTypeNames))
                    .then(result => {
                        console.log('RESULT!!!', newTrips);
                        for (let i = 0; i < newTrips.length; i++) {
                            // console.log(newTrips[i]);
                            newTrips[i].excelTableDriverChanges = [];
                            for (let m = 0; m < newTrips[i].driverChanges.length; m++) {
                                if ((m + 1) % 2 !== 0) {
                                    newTrips[i].excelTableDriverChanges.push([newTrips[i].driverChanges[m],
                                        newTrips[i].driverChanges[m + 1] ? newTrips[i].driverChanges[m + 1] : null]);
                                }
                            }
                        }
                        this.setState({trips:newTrips,createdReport: true, showLoader: false, usersLoaded: true, isExcel:false, tripsIsLoaded: true});
                    });
            })
        // });
    };

    recursivlyGetDistance = (index, driver, drivers, newTrips, zoneTypeNames, promise) => {
        return promise.then(() => {
            index++
            if (drivers.length !== index) {
                // console.log(index);
                return this.recursivlyGetDistance(index, drivers[index], drivers, newTrips, zoneTypeNames,
                    this.getDistance(drivers[index], newTrips, zoneTypeNames))
                    .catch( err => console.error(err) )
            } else {
                return drivers;
            }
        })
    }

    getDistance = (day, newTrips, zoneTypeNames) => {
        return new Promise((resolve, reject) => {
            let calls = [];
            if (day) {
                day.driverChanges.forEach(change => {
                    let toDate = moment(change.dateTime).add(15, 'minutes').toISOString();
                    let query = {
                        typeName: 'LogRecord',
                        search: {
                            fromDate: change.dateTime,
                            toDate: toDate,
                            deviceSearch: {
                                id: change.device.id
                            }
                        },
                        resultsLimit: 1
                    };
                    calls.push(["Get", query])
                });
            }
            timeCard.api.multiCall(calls)
                .then(res=>{
                    let promises = [];

                    let coords = res[0];

                    if (Array.isArray(res[0])) coords = res[0][0];

                    var promise = new Promise( (resolve, reject) => {
                        timeCard.api.call('GetAddresses', {
                            "coordinates": [{"x": coords.longitude, "y": coords.latitude}],
                            "isMovingAddresses": true
                        })
                            .then( data => {
                                this.state.promises = [];
                                let foundZones = [];
                                if (data[0].zones) {
                                    for (var zoneCount = 0; zoneCount < data[0].zones.length; zoneCount++) {
                                        if (allZones[data[0].zones[zoneCount].id]) {
                                            foundZones.push(allZones)
                                        }
                                        // this.comparePromises(data[0].zones[zoneCount].id);
                                    }
                                }
                                resolve({data: data, result: foundZones});
                                // this.isHomeZone()
                                //     .then( result => {
                                //         resolve({data: data, result: result});
                                //     })
                                //     .catch(err => {
                                //         console.log(err);
                                //         resolve({data: data});
                                //     });
                            })
                            .catch(err => {
                                console.log(err);
                                reject(err);
                            });
                    });
                    promises.push(promise);

                    // for (let m = 0; m < res.length; m++) {
                    //     var promise;
                    //     if(res[m].length !== 0) {
                    //
                    //     } else {
                    //         promise = new Promise( (resolve, reject) => {
                    //             timeCard.api.multiCall(calls)
                    //                 .then( data => {
                    //                     console.log('noLogRecord');
                    //                     resolve();
                    //                 })
                    //         })
                    //     }
                    //
                    // }
                    // if (promise.length === 0) promises = [];
                    Promise.all(promises)
                        .then( result => {
                            if (!day.mileageExpense) day.mileageExpense = 0;
                            day.totalHours = 0;


                            day.driverChanges.forEach((change, index) => {
                                let isHomeZone = false;
                                let isCustomersZone = false;
                                let zoneNames = '';
                                if (result && result.length > 0 && result[index] &&
                                    result[index].data[0] && result[index].data[0].zones) {
                                    let zoneArray = [];
                                    for (let i = 0; i < result[index].result.length; i++) {
                                        zoneArray = zoneArray.concat(result[index].result[i]);
                                    }
                                    for (let n = 0; n < zoneArray.length; n++) {
                                        if (zoneArray[n].zoneTypes.length > 0 &&
                                            zoneArray[n].zoneTypes[0] === 'ZoneTypeHomeId') {
                                            isHomeZone = true;
                                        }
                                    }

                                    if (zoneArray.length > 0) {
                                        zoneNames = ' / ';
                                        for (let zoneNameCount = 0; zoneNameCount < zoneArray.length; zoneNameCount++) {
                                            (zoneNameCount + 1) === zoneArray.length ?
                                                zoneNames += zoneArray[zoneNameCount].name :
                                                zoneNames += zoneArray[zoneNameCount].name + ', ';
                                        }
                                    } else {
                                        change.brokenZone = true;
                                    }

                                    for (let i = 0; i < result[index].data[0].zones.length; i++) {
                                        for (let n = 0; n < this.state.customerZones.length; n++) {
                                            if (result[index].data[0].zones[i].id === this.state.customerZones[n]) {
                                                isCustomersZone = true;
                                            }
                                        }
                                    }
                                    change.zones = result[index].data[0].zones;
                                }
                                change.isCustomerZone = isCustomersZone;
                                change.isHomeZone = isHomeZone;
                                change.address = result[index] ? result[index].data[0].formattedAddress + zoneNames : 'No address';
                                change.googleMapsAddress = result[index] ? result[index].data[0].formattedAddress : '';

                                // if (isCustomersZone) {
                                //     if (index + 1 === day.driverChanges.length) {
                                //         if (!day.today)
                                //             day.totalHours += moment(change.dateTime).endOf('day') - moment(change.dateTime);
                                //     } else {
                                //         day.totalHours += moment(day.driverChanges[index + 1].dateTime) - moment(change.dateTime);
                                //     }
                                //     console.log(day.totalHours, 'CHANGE DIFF');
                                // }

                                if ((index + 1) === day.driverChanges.length) {
                                    if ((index + 1) % 2 === 0 && isCustomersZone) {
                                        day.mileageExpense = this.checkDistanceForZoneWithAddresses(res[index].latitude,
                                            res[index].longitude, change, zoneTypeNames);
                                    } else {
                                        if (res[index - 1]) {
                                            day.mileageExpense = this.checkDistanceForZoneWithAddresses(res[index - 1].latitude,
                                                res[index - 1].longitude, change, zoneTypeNames);
                                        }
                                    }
                                }
                            });


                            let changes = day.driverChanges;
                            for (let i = 0; i < changes.length; i++) {
                                // if (changes[i].isCustomerZone) {
                                    if (i + 1 == changes.length) {
                                        if (!day.today)
                                            day.totalHours += moment(changes[i].dateTime).endOf('day') - moment(changes[i].dateTime);
                                        i++
                                    } else {
                                        day.totalHours += moment(changes[i + 1].dateTime) - moment(changes[i].dateTime);
                                        i++
                                    }
                                // }
                            }
                            console.log(day.totalHours);


                            newTrips.push(day);
                            resolve(result);
                        })
                        .catch(err => {
                            newTrips.push(day);
                            console.log(err);
                            reject(err);
                        })
                })
                .catch(err => {
                    newTrips.push(day);
                    console.log(err);
                    reject(err);
                })
        })
    };

    checkDistanceForZoneWithAddresses = (keyOutLat, keyOutLng, day, zoneTypeNames) => {
        let distances = [];
        let zoneToSearch;
        let mileageExpense = null;
        zoneToSearch = zoneTypeNames[zone];
        if (zoneToSearch) {
            for (let i = 0; i < zoneToSearch.points.length; i++) {
                if (i !== 0) {
                    // console.log('lat', zoneToSearch.points[i].y, 'lon', zoneToSearch.points[i].x)
                    var dis = this.getDistanceFromLatLonInKm(keyOutLat, keyOutLng, zoneToSearch.points[i].y, zoneToSearch.points[i].x);
                    distances.push(dis);
                }
            }
            let minDistance = Math.min.apply(null, distances);
            let minDistanceInKilometers = minDistance;
            let milesMinimum = parseInt(this.state.milesMinimum);
            if (minDistanceInKilometers > milesMinimum) {
                minDistanceInKilometers = minDistanceInKilometers - milesMinimum;
                mileageExpense = parseInt((minDistanceInKilometers * parseFloat(this.state.mileRate)));
            }
        }
        return mileageExpense;
    }

    sendSettings = () => {
        let method, url;
        if (this.state.settingsId) {
            method = 'PUT';
            url = `https://nginx.zenduit.com:3177/reports/${this.state.settingsId}`;
        } else {
            method = 'POST';
            url = 'https://nginx.zenduit.com:3177/reports/';
        }

        let self = this;
        this.makeRequest(method, url,
            {
                reportName: 'timeCard',
                database: timeCard.cred.database,
                options: {
                    weekHours: self.state.weekHours,
                    dayHours: self.state.dayHours,
                    lunchTime: self.state.lunchTime,
                    setToDefault: self.state.setToDefault,
                    milesMinimum: self.state.milesMinimum,
                    mileRate: self.state.mileRate,
                    officeZone: self.state.officeZone
                },
                sendingPeriod: {
                    week: this.state.weekEmails.split(';'),
                    day: this.state.dayEmails.split(';')
                },
                server: window.location.hostname.split('.')[0]
            })
            .then((data) => {
                this.setState({openSettings: false, openSnackbar: true, settingsId: data._id})
            })
            .catch((err) => {
                console.log(err);
            });
    };

    makeRequest = (type, url, data) => {
        return new Promise( (resolve, reject) => {
            $.ajax({
                type: type,
                url: url,
                contentType: "application/json",
                dataType: 'json',
                data: JSON.stringify(data),
                success: (res)=> {
                    // console.log(res);
                    resolve(res);
                    this.setState({openSettings: false, openSnackbar: true, settingsId: data._id})
                },
                error: (err) => {
                    reject(err);
                }
            });
        });
    };

    getGroups = (day) => {
        return day.driverChanges[0].driver.driverGroups.reduce((groupsArray, group) => {
            if (group.id && group.id != "GroupCompanyId"){
                groupsArray.push(this.state.groupsMap[group.id].name)
            }
            return groupsArray
        }, []).join(', ');
    };

    filterOvertime = (day, overTimeMills) => {
        let time,
            setToDefault = this.state.setToDefault,
            driverChangesLength = day.driverChanges.length,
            overTimeLess = (overTimeMills < day.diff),
            overTimeMore = (overTimeMills > day.diff),
            resultLength = (driverChangesLength % 2 !== 0);

        if ((overTimeLess && (setToDefault && resultLength)) || (overTimeMore && (setToDefault && resultLength)) || overTimeMore) {
            time = '00:00';
        } else if (overTimeLess) {
            time = moment(day.diff-overTimeMills).utc().format('HH:mm');
        }
        return time;
    };

    handleChange = (event, index, officeZone) => this.setState({officeZone: officeZone});

    showInfo = (day, text, mapData, map, LeafIcon, textArray) => {
        const calls = [];
        let mapInfo = [];
        let driverName = '';
        day.driverChanges.forEach(change => {
            driverName = change.driver.firstName + ' ' + change.driver.lastName
            let toDate = moment(change.dateTime).add(5, 'minutes').toISOString();
            let query = {
                typeName: 'LogRecord',
                search: {
                    fromDate: change.dateTime,
                    toDate: toDate,
                    deviceSearch: {
                        id: change.device.id
                    }
                },
                resultsLimit: 1
            };
            calls.push(["Get", query])
        });
        timeCard.api.multiCall(calls)
            .then(res=>{
                let countLength = 0;
                let savedText = text;


                if (res.length === 0) {
                    mapInfo.push({
                        formattedAddress: 'No address',
                        keyInOut: '',
                        time: '',
                        isHomeZone: false,
                        googleMapAddress: '',
                        zones: []
                    });
                    this.setState({driverName: driverName, mapInfo: mapInfo, showLoader: false});
                }  else {
                    this.recursevlyGetAddress(0, res, day, text, mapData, map, LeafIcon, textArray, mapInfo, driverName,
                        this.getAddress(0, res, day, text, mapData, map, LeafIcon, textArray, mapInfo, driverName))
                        .then((result) => {
                            // console.log(result);
                            this.setState({
                                showLoader: false
                            })
                        });
                }
            })
    };

    recursevlyGetAddress = (index, logs, day, text, mapData, map, LeafIcon, textArray, mapInfo, driverName, promise) => {
        return promise.then(() => {
            index++
            if (logs.length !== index) {
                // if (index !== 5) {
                return this.recursevlyGetAddress(index, logs, day, text, mapData, map, LeafIcon, textArray, mapInfo, driverName,
                    this.getAddress(index, logs, day, text, mapData, map, LeafIcon, textArray, mapInfo, driverName))
                    .catch( err => console.error(err) )
            } else {
                return 'done'
            }
        })
    }

    getAddress = (index, logs, day, text, mapData, map, LeafIcon, textArray, mapInfo, driverName) => {
        return new Promise((resolve, reject) => {
            timeCard.api.call('GetAddresses', {
                "coordinates": [{"x": logs[index][0] ? logs[index][0].longitude : logs[index].longitude,
                    "y": logs[index][0] ? logs[index][0].latitude : logs[index].latitude}],
                "isMovingAddresses": true
            })
                .then( list => {
                    let isHomeZone = false;
                    if (list[0].zones) {
                        this.state.promises = [];
                        for (var zoneCount = 0; zoneCount < list[0].zones.length; zoneCount++) {
                            this.comparePromises(list[0].zones[zoneCount].id);
                        }
                        this.isHomeZone()
                            .then( result => {
                                let zoneArray = [];
                                for (let i = 0; i < result.length; i++) {
                                    zoneArray = zoneArray.concat(result[i]);
                                }
                                for (let n = 0; n < zoneArray.length; n++) {
                                    if (zoneArray[n].zoneTypes.length > 0 &&
                                        zoneArray[n].zoneTypes[0] === 'ZoneTypeHomeId') {
                                        isHomeZone = true;
                                    }
                                }

                                let textInfo = '';
                                // if (index === logs.length) return;
                                if ((index + 1) % 2 === 0) {
                                    textInfo = `KO-${Math.ceil((index + 1) / 2)} ${moment(mapData[index].dateTime).format('h:mm:ss A')}`
                                } else {
                                    textInfo = `KI-${Math.ceil((index + 1) / 2)} ${moment(mapData[index].dateTime).format('h:mm:ss A')}`
                                }

                                let codelines = textInfo;
                                let firstWords = [];
                                for (let s=0;s<codelines.length;s++) {
                                    let words = codelines[s].split(" ");
                                    firstWords.push(words[0]);
                                }
                                let keyInKeyOut = '';
                                for (let letterCount = 0;letterCount < firstWords.length; letterCount++) {
                                    if (firstWords[letterCount] !== "") {
                                        keyInKeyOut += firstWords[letterCount];
                                    } else {
                                        break;
                                    }
                                }

                                let zoneNames = '';
                                if (zoneArray.length > 0) {
                                    zoneNames = ' / ';
                                    for (let zoneNameCount = 0; zoneNameCount < zoneArray.length; zoneNameCount++) {
                                        zoneNameCount === zoneArray.length ?
                                            zoneNames += zoneArray[zoneNameCount].name :
                                            zoneNames += zoneArray[zoneNameCount].name + ', ';
                                    }
                                }

                                mapInfo.push({
                                    keyInOut: keyInKeyOut,
                                    time: textInfo.substr(textInfo.indexOf(" ") + 1),
                                    formattedAddress: list[0] ? list[0].formattedAddress + zoneNames : '',
                                    isHomeZone: isHomeZone,
                                    googleMapAddress: list[0].formattedAddress,
                                    zones: list[0].zones
                                });
                                this.setState({driverName: driverName, mapInfo: mapInfo});

                                let color = this.setBgZone({
                                    time: textInfo,
                                    formattedAddress: list[0] ? list[0].formattedAddress + zoneNames : '',
                                    isHomeZone: isHomeZone,
                                    zones: list[0].zones
                                })
                                // if ((mapInfo.length - 1) === 0) return;
                                // if ((mapInfo.length - 1) === 1) mapData[mapInfo.length-1] = mapData[mapInfo.length-1];

                                let marker = L.marker([mapData[index].latitude, mapData[index].longitude], {
                                    icon: new LeafIcon({number: index + 1, iconUrl: this.setMarkerColor(color) })
                                });
                                marker.addTo(map);
                                resolve();
                            })
                    } else {

                        let textInfo = '';
                        // if (index === logs.length) return;
                        // if (mapData.length === 1) change = change[0];
                        if ((index + 1) % 2 === 0) {
                            textInfo = `KO-${Math.ceil((index + 1) / 2)} ${moment(mapData[index].dateTime).format('h:mm:ss A')}`
                        } else {
                            textInfo = `KI-${Math.ceil((index + 1) / 2)} ${moment(mapData[index].dateTime).format('h:mm:ss A')}`
                        }

                        let codelines = textInfo;
                        let firstWords = [];
                        for (let s=0;s<codelines.length;s++) {
                            let words = codelines[s].split(" ");
                            firstWords.push(words[0]);
                        }
                        let keyInKeyOut = '';
                        for (let letterCount = 0;letterCount < firstWords.length; letterCount++) {
                            if (firstWords[letterCount] !== "") {
                                keyInKeyOut += firstWords[letterCount];
                            } else {
                                break;
                            }
                        }

                        mapInfo.push({
                            keyInOut: keyInKeyOut,
                            time: textInfo.substr(textInfo.indexOf(" ") + 1),
                            formattedAddress: list[0] ? list[0].formattedAddress : '',
                            googleMapAddress: list[0].formattedAddress,
                            isHomeZone: isHomeZone,
                            zones: list[0].zones
                        });
                        this.setState({driverName: driverName, mapInfo: mapInfo});

                        let color = this.setBgZone({
                            time: textInfo,
                            formattedAddress: list[0] ? list[0].formattedAddress : '',
                            isHomeZone: isHomeZone,
                            zones: list[0].zones
                        })
                        // if (mapInfo.length-1 === 0) return;
                        // if (mapInfo.length-1 === 1) mapData[mapInfo.length-1] = mapData[mapInfo.length-1];

                        let marker = L.marker([mapData[index].latitude, mapData[index].longitude], {
                            icon: new LeafIcon({number: index + 1, iconUrl: this.setMarkerColor(color) })
                        });
                        marker.addTo(map);
                        resolve();
                    }
                })
                .catch( err => {
                    reject(err);
                })
        });
    }

    setMarkerColor = (color) => {
        let marker = '';
        if (color === 'rgb(244, 66, 66)') {
            marker = 'https://storage.googleapis.com/time-card/map-marker-red.png';
        } else if (color === 'rgb(244, 244, 66)') {
            marker = 'https://storage.googleapis.com/time-card/map-marker-yellow.png';
        } else {
            marker = 'https://storage.googleapis.com/time-card/map-marker.png';
        }
        return marker;
    };

    comparePromises = (data) => {
        var promise = new Promise( (resolve, reject) => {
            timeCard.api.call("Get", { typeName: "Zone", search: {id: data}})
                .then( data => {
                    resolve(data);
                })
                .catch(err => {
                    reject(err);
                });
        });
        this.state.promises.push(promise);
    };

    isHomeZone = () => {
        return Promise.all(this.state.promises)
            .then( result => {
                return result;
            })
            .catch(err => {
                return err;
            })
    };

    setBgZone = (row) => {
        if (row !== null) {
            let color;
            if (!row.zones && !row.isHomeZone || row.brokenZone) {
                color = 'rgb(244, 66, 66)'; //red
            } else {
                color = 'inherit';
            }
            return color;
        } else {
            return;
        }
    };

    getZone = () => {
        timeCard.api.call("Get", { typeName: "Zone"})
            .then( data => {
                data = data.filter(item => {
                    return item.zoneTypes.length > 0 && (typeof item.zoneTypes[0] === 'string'  && item.zoneTypes[0] === 'ZoneTypeOfficeId');
                });
                this.setState({zones: data})
                // console.log(data);
            });
    };

    parseTime = (mins) => {
        var hours = Math.trunc(mins/60);
        var minutes = mins % 60;
        minutes = minutes > 9 ? minutes : '0' + minutes;
        hours = hours > 9 ? hours : '0' + hours;
        return hours +":"+ minutes;
    }

    getDistanceFromLatLonInKm = (lat1,lon1,lat2,lon2) => {
        let R = 6371; // Radius of the earth in km
        let dLat = this.deg2rad(lat2-lat1);  // deg2rad below
        let dLon = this.deg2rad(lon2-lon1);
        let a =
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2)
            ;
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        let d = R * c; // Distance in km
        return d;
    };

    deg2rad = (deg) => {
        return deg * (Math.PI/180)
    };

    getTotalHours = (mileageExpense, time) => {
        let timeHours = parseInt(time.substring(0, 2)), timeMinutes = parseInt(time.substring(3, 5));
        timeMinutes = (timeHours*60) + timeMinutes;
        let resultMinutes = mileageExpense + timeMinutes;
        return this.parseTime(resultMinutes);
        // let mileageHours = mileageExpense.substring(0, 2), mileageMinutes = mileageExpense.substring(3, 5),
        //     timeHours = time.substring(0, 2), timeMinutes = time.substring(3, 5),
        // resultHours = parseInt(mileageHours) + parseInt(timeHours),
        // resultMinutes = parseInt(mileageMinutes) + parseInt(timeMinutes);
        // resultHours = resultHours > 9 ? JSON.stringify(resultHours) : '0' + JSON.stringify(resultHours)
        // resultMinutes = resultMinutes > 9 ? JSON.stringify(resultMinutes) : '0' + JSON.stringify(resultMinutes)
        // return resultHours + ':' + resultMinutes;
    }

    render() {
        let start = this.state.startDate.format('YYYY-MM-DD');
        let end = this.state.endDate.format('YYYY-MM-DD');
        let label = start + ' - ' + end;
        if (start === end) {
            label = start;
        }
        let buttonStyle = {marginLeft:'10px', marginTop: '5px'};
        let overTimeMills = (+this.state.dayHours)*60*60*1000;

        return (
            <MuiThemeProvider>
                <div>
                    <div>
                        <div style= {{display: this.state.showLoader ? 'block' : 'none'}} className="loading-container">
                            <div className="loading"></div>
                        </div>
                        <DateRangePicker style = {{width: '230px', display: 'inline-block'}} startDate={this.state.startDate} endDate={this.state.endDate}
                                         ranges={this.state.ranges} onEvent={this.handleEvent}>
                            <Button className="selected-date-range-btn" style={{width:'100%'}}>
                                <div className="pull-left"><BS.Glyphicon glyph="calendar" /></div>
                                <div className="pull-right">
									<span>
										{label}
									</span>
                                    <span className="caret"/>
                                </div>
                            </Button>
                        </DateRangePicker>
                        <select multiple/>
                        <RaisedButton style = {buttonStyle} disabled = {!this.state.createdReport} label = 'Export to Excel'
                                      onClick = {() => this.createTable()}/>
                        <RaisedButton style = {buttonStyle} disabled = {!this.state.usersLoaded} label = 'Settings'
                                      onClick = {() => this.setState({openSettings: true})}/>

                        <RaisedButton style = {buttonStyle}
                                      disabled = {moment(this.state.startDate).add(dateCount, 'days').toISOString() === this.state.startDate.toISOString()}
                                      label = 'Previous Day'
                                      onClick = {() => this.loadPrevDay()}/>
                        <RaisedButton style = {buttonStyle}
                                      disabled = {moment(this.state.startDate).add(dateCount+1, 'days').endOf('day').toISOString() > this.state.endDate.toISOString()}
                                      label = 'Next Day'
                                      onClick = {() => this.loadNextDay()}/>
                    </div>
                    {this.state.trips && isLoadedResults ?
                        <table id = 'table' style = {this.state.isExcel ? {display: 'none',textAlign: 'center'}: {display:'table',textAlign: 'center'}}>
                            <thead style = {{textAlign: 'center'}}>
                            <tr className="table-head">
                                <th style = {{textAlign: 'center', padding: '7px'}}>Driver</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Date</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Vehicle</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Last key in</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Last key out</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Logs Qty</th>
                                <th style = {{textAlign: 'center', padding: '7px', display: 'none'}}>Last key in address</th>
                                <th style = {{textAlign: 'center', padding: '7px', display: 'none'}}>Last key out address</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Regular Hours</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Overtime hours</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Total Hours</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Mileage Expense</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Total Hours with Mileage</th>
                                {this.state.isExcel && <th style = {{textAlign: 'center', padding: '7px'}}>Groups</th>}
                            </tr>
                            </thead>
                            <tbody className="table-body">
                            {this.state.trips.map((day) => {
                                let isForgotToScanOut = day.driverChanges.length % 2 == 0 ?
                                    moment(day.driverChanges[day.driverChanges.length-1].dateTime).format('h:mm:ss A'):
                                    day.today ? 'working' : 'forgot to scan';
                                return <tr>
                                    <td style = {{padding: '7px'}}>{`${day.driverChanges[0].driver.firstName} ${day.driverChanges[0].driver.lastName}`}</td>
                                    <td style = {{padding: '7px'}}>{moment(day.driverChanges[0].dateTime).format('dddd MMM DD')}</td>
                                    <td style = {{padding: '7px'}}>{day.driverChanges[0].device.name}</td>
                                    <td style = {{padding: '7px'}}>{day.driverChanges.length % 2 == 0 ?
                                        moment(day.driverChanges[day.driverChanges.length-2].dateTime).format('h:mm:ss A') :
                                        moment(day.driverChanges[day.driverChanges.length-1].dateTime).format('h:mm:ss A')} </td>
                                    <td  style = {day.driverChanges.length % 2 == 0 ? {padding: '7px'} : day.today ? {background: '#f4f442', padding: '7px'} :
                                    {background: '#f44242', padding: '7px'}}>
                                        {day.driverChanges.length % 2 == 0 ?
                                            moment(day.driverChanges[day.driverChanges.length-1].dateTime).format('h:mm:ss A'):
                                            day.today ? "Is working now" : "Forgot to Scan Out"}</td>
                                    <td style = {{padding: '7px', cursor:'pointer', color:'blue'}} onClick = {()=> {
                                        this.setState({
                                            showLoader: true
                                        })
                                        this.createMap(day)
                                    }}>
                                        {day.logs}
                                    </td>
                                    <td style = {{padding: '7px', display: 'none'}}>
                                        {day.driverChanges.length % 2 == 0 ?
                                            (day.driverChanges.length > 1 ?
                                                day.driverChanges[day.driverChanges.length-2].address : '') :
                                            (day.driverChanges.length > 0 ?
                                                day.driverChanges[day.driverChanges.length-1].address : '')}
                                    </td>
                                    <td style = {{padding: '7px', display: 'none'}}>
                                        {day.driverChanges.length % 2 == 0 ?
                                            (day.driverChanges.length > 0 ?
                                                day.driverChanges[day.driverChanges.length-1].address : '') :
                                            (day.driverChanges.length > 1 ?
                                                day.driverChanges[day.driverChanges.length-2].address : '')}
                                    </td>
                                    <td style = {{padding: '7px'}}>{overTimeMills < day.diff ? moment(overTimeMills).utc().format('HH:mm') : moment(day.diff).utc().format('HH:mm')}</td>
                                    <td style = {{padding: '7px'}}>{this.filterOvertime(day, overTimeMills)}</td>
                                    <td style = {{padding: '7px'}}>{isForgotToScanOut !== 'forgot to scan' ? this.state.setToDefault && day.driverChanges.length % 2 !== 0 ? overTimeMills < day.totalHours ? moment(overTimeMills).utc().format('HH:mm') : moment(day.totalHours).utc().format('HH:mm') : moment(day.totalHours).utc().format('HH:mm') : '0' + this.state.dayHours + ':00'}</td>
                                    <td style = {{padding: '7px'}}>{day.mileageExpense ? this.parseTime(day.mileageExpense) : '00:00'}</td>
                                    <td style = {{padding: '7px'}}>{this.getTotalHours((day.mileageExpense ? day.mileageExpense : 0), (isForgotToScanOut !== 'forgot to scan' ? this.state.setToDefault && day.driverChanges.length % 2 !== 0 ? overTimeMills < day.totalHours ? moment(overTimeMills).utc().format('HH:mm') : moment(day.totalHours).utc().format('HH:mm') : moment(day.totalHours).utc().format('HH:mm') : '0' + this.state.dayHours + ':00'))}</td>
                                    {this.state.isExcel && <td>{this.getGroups(day)}</td>}
                                </tr>
                            })}
                            </tbody>
                        </table>: null}

                    {!isLoadedResults ? <p>No results.</p> : null}
                    {this.state.trips && isLoadedResults ?
                        <table id = 'table_excel' style = {{display: 'none',textAlign: 'center'}}>
                            <thead style = {{textAlign: 'center'}}>
                            <tr className="table-head">
                                <th style = {{textAlign: 'center', padding: '7px'}}>Driver</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Date</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Vehicle</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Logs Qty</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Key in address</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Key in time</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Key out address</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Key out time</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Regular Hours</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Overtime hours</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Total Hours</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Mileage Expense</th>
                                <th style = {{textAlign: 'center', padding: '7px'}}>Total Hours with Mileage</th>
                                {this.state.isExcel && <th style = {{textAlign: 'center', padding: '7px'}}>Groups</th>}
                            </tr>
                            </thead>
                            <tbody className="table-body">
                            {this.state.trips.map((day, indexTrips) => {
                                let isForgotToScanOut = day.driverChanges.length % 2 == 0 ?
                                    moment(day.driverChanges[day.driverChanges.length-1].dateTime).format('h:mm:ss A'):
                                    day.today ? 'working' : 'forgot to scan';
                                return day.excelTableDriverChanges ? day.excelTableDriverChanges.map ((driverChange, indexDriverChange) => {
                                    let queryKeyIn = [
                                        'tripsHistory',
                                        'dateRange:(startDate:\'' + driverChange[0].dateTime + '\',endDate:\'' + moment(driverChange[0].dateTime).add(3, 'minutes').toISOString() + '\')',
                                        'devices:!(' + driverChange[0].device.id + ')'
                                    ].join(',');
                                    let queryKeyOut = '';
                                    if (driverChange[1] !== null) {
                                        queryKeyOut = [
                                            'tripsHistory',
                                            'dateRange:(startDate:\'' + driverChange[1].dateTime + '\',endDate:\'' + moment(driverChange[1].dateTime).add(3, 'minutes').toISOString() + '\')',
                                            'devices:!(' + driverChange[1].device.id + ')'
                                        ].join(',');
                                    }
                                    return <tr>
                                        <td style = {{padding: '7px'}}>{`${day.driverChanges[0].driver.firstName} ${day.driverChanges[0].driver.lastName}`}</td>
                                        <td style = {{padding: '7px'}}>{moment(driverChange[0].dateTime).format('dddd MMM DD')}</td>
                                        <td style = {{padding: '7px'}}>{day.driverChanges[0].device.name}</td>
                                        <td style = {{padding: '7px', cursor:'pointer', color:'blue'}}>
                                            {day.logs}
                                        </td>
                                        <td className={ indexTrips + 1 === this.state.trips.length ? 'address-td' : '' }
                                            style = {{padding: '7px', backgroundColor: this.setBgZone(driverChange[0])}}>
                                            <a href={'https://' + window.location.host + '/' + timeCard.cred.database +
                                            '/#' + queryKeyIn} target="_blank">{driverChange[0].address ? driverChange[0].address : ''}</a>
                                        </td>
                                        <td style = {{padding: '7px'}}>
                                            <a href={'https://www.google.com.ua/maps/place/' + driverChange[0].googleMapsAddress.replace(' ', '+')} target="_blank">{moment(driverChange[0].dateTime).format('h:mm:ss A')}</a>
                                        </td>
                                        <td style = {{padding: '7px', backgroundColor: this.setBgZone(driverChange[1])}}>
                                            <a href={driverChange[1] !== null ? 'https://' + window.location.host + '/' + timeCard.cred.database +
                                            '/#' + queryKeyOut : ''} target="_blank">{driverChange[1] !== null ? driverChange[1].address : ''}</a>
                                        </td>
                                        <td style = {driverChange[1] !== null ? {padding: '7px'} : day.today ? {background: '#f4f442', padding: '7px'} :
                                        {background: '#f44242', padding: '7px'}}>
                                            <a href={'https://www.google.com.ua/maps/place/' + (driverChange[1] !== null ? driverChange[1].googleMapsAddress.replace(' ', '+') : '')} target="_blank">
                                                {driverChange[1] !== null ? moment(driverChange[1].dateTime).format('h:mm:ss A') : ''}
                                            </a>
                                        </td>
                                        <td style = {{padding: '7px'}}>{overTimeMills < day.diff ? moment(overTimeMills).utc().format('HH:mm') : moment(day.diff).utc().format('HH:mm')}</td>
                                        <td style = {{padding: '7px'}}>{this.filterOvertime(day, overTimeMills)}</td>
                                        <td style = {{padding: '7px'}}>{isForgotToScanOut !== 'forgot to scan' ? this.state.setToDefault && day.driverChanges.length % 2 !== 0 ? overTimeMills < day.totalHours ? moment(overTimeMills).utc().format('HH:mm') : moment(day.totalHours).utc().format('HH:mm') : moment(day.totalHours).utc().format('HH:mm') : '0' + this.state.dayHours + ':00'}</td>
                                        <td style = {{padding: '7px'}}>{day.mileageExpense ? this.parseTime(day.mileageExpense) : '00:00'}</td>
                                        <td style = {{padding: '7px'}}>{this.getTotalHours((day.mileageExpense ? day.mileageExpense : 0), (isForgotToScanOut !== 'forgot to scan' ? this.state.setToDefault && day.driverChanges.length % 2 !== 0 ? overTimeMills < day.totalHours ? moment(overTimeMills).utc().format('HH:mm') : moment(day.totalHours).utc().format('HH:mm') : moment(day.totalHours).utc().format('HH:mm') : '0' + this.state.dayHours + ':00'))}</td>
                                        {this.state.isExcel && <td>{this.getGroups(day)}</td>}
                                    </tr>
                                }) : null
                            })}
                            </tbody>
                        </table>: null}

                    <Dialog
                        style={{paddingLeft: '200px'}}
                        contentStyle={{width: '1500px'}}
                        open={this.state.openSettings}
                        onRequestClose={() => this.setState({openSettings: false})}>
                        <TextField style = {{paddingLeft:'10px'}}
                                   floatingLabelText="Weekly Standard Hours"
                                   floatingLabelFixed={true}
                                   onChange={(e)=> this.setState({weekHours:e.target.value})}
                                   value = {this.state.weekHours}
                                   type="number"
                        />
                        <TextField style = {{paddingLeft:'10px'}}
                                   floatingLabelText="Daily Standard Hours"
                                   floatingLabelFixed={true}
                                   onChange={(e)=> this.setState({dayHours:e.target.value})}
                                   value = {this.state.dayHours}
                                   type="number"
                        />
                        <TextField style = {{paddingLeft:'10px'}}
                                   floatingLabelText="Lunch TIme"
                                   floatingLabelFixed={true}
                                   onChange={(e)=> this.setState({lunchTime:e.target.value})}
                                   value = {this.state.lunchTime}
                                   type="number"
                        />
                        <TextField style = {{paddingLeft:'10px'}}
                                   floatingLabelText="Kilometers from office minimum"
                                   floatingLabelFixed={true}
                                   onChange={(e)=> this.setState({milesMinimum:e.target.value})}
                                   value = {this.state.milesMinimum}
                                   type="number"
                        />
                        <SelectField
                            floatingLabelText="Office zone"
                            value={this.state.officeZone}
                            onChange={this.handleChange}>
                            {this.state.zones.map((zone, index) => {
                                return <MenuItem value={index} primaryText={zone.name} />
                            })}
                        </SelectField>
                        <TextField style = {{paddingLeft:'10px'}}
                                   floatingLabelText="Per mile rate (min/km)"
                                   floatingLabelFixed={true}
                                   onChange={(e)=> this.setState({mileRate:e.target.value})}
                                   value = {this.state.mileRate}
                                   type="number"
                        />

                        <Checkbox
                            defaultChecked={false}
                            label="Set to default hours"
                            checked={this.state.setToDefault}
                            onCheck={(e) => {
                                this.setState({
                                    setToDefault: !this.state.setToDefault})
                            }}
                        />

                        <div>
                            Weekly report
                            <TextField style = {{paddingLeft:'10px'}}
                                       floatingLabelText="Emails (split by ;)"
                                       floatingLabelFixed={true}
                                       onChange={(e)=> this.setState({weekEmails:e.target.value})}
                                       value = {this.state.weekEmails}
                            />
                        </div>
                        <div>
                            Daily report
                            <TextField style = {{paddingLeft:'10px'}}
                                       floatingLabelText="Emails (split by ;)"
                                       floatingLabelFixed={true}
                                       onChange={(e)=> this.setState({dayEmails:e.target.value})}
                                       value = {this.state.dayEmails}
                            />
                        </div>
                        <RaisedButton style = {buttonStyle} label = 'Save Settings'
                                      onClick = {() => this.sendSettings()}/>


                    </Dialog>

                    <Dialog
                        style={{paddingLeft: '200px', width: '90%', paddingTop: '0'}}
                        contentStyle={{height: '800px'}}
                        open={this.state.openMap}
                        className="map_dialog"
                        onRequestClose={() => {
                            this.setState({openMap: false})
                            $('.map_dialog_content').removeClass('map_dialog_content');
                        }}>
                        <div id="info-map" style={{width: '50%', float: 'left', overflowY: 'auto', height: '630px', paddingRight: '30px',
                            paddingLeft: '0'}}>
                            <Table
                                height="300px"
                                fixedHeader={true}
                                fixedFooter={true}>
                                <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
                                    <TableRow>
                                        <TableHeaderColumn colSpan="3" style={{textAlign: 'center'}}>
                                            <span>{this.state.driverName}</span> <br/> <span>Key In and Out for</span>
                                            <br/> <span>{moment(this.state.startDate).format('dddd MMM DD')
                                        + ' - ' + moment(this.state.endDate).format('dddd MMM DD')}</span>
                                        </TableHeaderColumn>
                                    </TableRow>
                                    <TableRow>
                                        <TableHeaderColumn style = {{width: "10%"}}>Key in/out</TableHeaderColumn>
                                        <TableHeaderColumn style = {{width: "70%"}}>Address/Zone</TableHeaderColumn>
                                        <TableHeaderColumn style = {{width: "20%"}}>Time</TableHeaderColumn>
                                    </TableRow>
                                </TableHeader>
                                <TableBody
                                    displayRowCheckbox={false}
                                    showRowHover={false}
                                    stripedRows={false}>
                                    {this.state.mapInfo.map( (row, index) => (
                                        // var googleMapLink = 'https://www.google.com.ua/maps/place/' + row.googleMapAddress.replace(' ', '+');
                                        <TableRow key={index}>
                                            <TableRowColumn style = {{width: "15%", paddingLeft: "10px",
                                                paddingRight: "10px", fontSize: "11px", backgroundColor: this.setBgZone(row)}}>{row.keyInOut ? row.keyInOut : ''}</TableRowColumn>
                                            <TableRowColumn style = {{width: "60%", paddingLeft: "10px", textOverflow: "clip", whiteSpace: "normal",
                                                paddingRight: "10px", fontSize: "11px", backgroundColor: this.setBgZone(row)}}>{row.formattedAddress}</TableRowColumn>
                                            <TableRowColumn style = {{width: "25%", paddingLeft: "10px",
                                                paddingRight: "10px", fontSize: "11px", backgroundColor: this.setBgZone(row)}}>
                                                <a href={'https://www.google.com.ua/maps/place/' + row.googleMapAddress.replace(' ', '+')} target="_blank">{row.time ? row.time : ''}</a>
                                            </TableRowColumn>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div id="keymap" style={{height:'630px', width: '50%', float: 'right'}}></div>
                    </Dialog>

                    <Snackbar
                        open={this.state.openSnackbar}
                        message={"Settings saved successfully"}
                        autoHideDuration={5000}
                        onRequestClose={() => this.setState({openSnackbar:false})}
                    />
                </div>
            </MuiThemeProvider>
        )
    };
}
export default GeotabPage;



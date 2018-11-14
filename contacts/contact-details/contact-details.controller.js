module.exports =
    angular
        .module('cpApp')
        .controller('contactDetailsController', ['User', 'ActionGroup', '$templateCache', '$state', '$stateParams', '$resource', '$window', '$scope', contactDetailsController])


function contactDetailsController(User, ActionGroup, $templateCache, $state, $stateParams, $resource, $window, $scope) {

    $templateCache.put('notes.partial.html', require('./partials/notes.partial.html'));
    $templateCache.put('sms-history.partial.html', require('./partials/sms-history.partial.html'));


    $templateCache.put('edit-note.html', require('./modals/edit-note.html'));
    $templateCache.put('notif-delete-note.html', require('./modals/notif-delete-note.html'));
    $templateCache.put('notif-save.html', require('./modals/notif-save.html'));
    $templateCache.put('sms-details.modal.html', require('./modals/sms-details.modal.html'));



    var $ = require('jquery');
            require('bootstrap/js/src/modal.js');

    var currentUser = User.currentUser();
    
    var defaultYear = new Date(Date.now()).getFullYear();
    var defaultMonth = new Date(Date.now()).getMonth();
    var defaultNumber = new Date(Date.now()).getDate();

    var defaultDate = new Date(defaultYear, defaultMonth, defaultNumber);

    var activeTabDefault = 'notes';    



    var vm = this;

        vm.saveChanges = saveChanges;
        vm.validateZIP = validateZIP;
        vm.saveNote = saveNote;
        vm.getNoteById = getNoteById;
        vm.updateNote = updateNote;
        vm.removeNote = removeNote;
        vm.clearNoteArea = clearNoteArea;
        vm.delayForInitDP = delayForInitDP;
        vm.preventTransitionIfLinkIsEpsent = preventTransitionIfLinkIsEpsent;
        vm.setProtocol = setProtocol;
        vm.assignAG = assignAG;
        vm.computeBubleOffset = computeBubleOffset;


        vm.newNote = {};
        vm.newNote = {
            date: new Date(Date.UTC(defaultYear, defaultMonth, defaultNumber))
        };

        vm.emptyNewDate = false;
        vm.emptyDate = false;
        vm.activeTab = activeTabDefault;
        // vm.trackResize = trackResize;

///////////////////// === CODE ===/////////////////////////////////////////////
        


        contactDetails();
        getNotes();
        getSms();
        delayForInitDP();


        

///////////////////// === END CODE === ////////////////////////////////////////



///////////////////// === IMPLEMENTATION === //////////////////////////////////

    function assignAG(ag) {
        
        ActionGroup.assignAG(ag);
    }

    function setProtocol(link) {
        if(link && link.indexOf('https://') === -1) {
            return 'https://'
        } else {
            return ''
        }
    }

    function preventTransitionIfLinkIsEpsent(e, link) {
        console.dir(e.target);
        if(!link) {
            e.preventDefault()
        }
    }

    function initGoogleMaps(id) {
        var GoogleMapsLoader = require('google-maps');
            GoogleMapsLoader.release();
            GoogleMapsLoader.KEY = "AIzaSyASl2aSi3TG0J1cWZAynZWA89VYfT898ZA";
            GoogleMapsLoader.load((google) => {

                var map = new google.maps.Map(document.getElementById(id), {zoom: 15});

                var geocoder = new google.maps.Geocoder();
                    geocoder.geocode({address: `${vm.contact.address.billingAddress.address1},${vm.contact.address.billingAddress.city},${vm.contact.address.billingAddress.state}`}, (result, status) => {
                        console.log(result);
                        if(status == 'OK') {
                            map.setCenter(result[0].geometry.location);
                            var marker = new google.maps.Marker({
                                map: map,
                                position: result[0].geometry.location
                            });
                        }
                    })
            })
    }

    function delayForInitDP() {
        setTimeout(() => {

            initDatepicker("datepickerForNew", vm.emptyNewDate, false);
        }, 0);
    }

    function initDatepicker(id, empty, exist) {

        require('bootstrap-datepicker');
        var $ = require('jquery');
        var moment = require('moment');

            $(`#${id}`).datepicker({
                format: 'mm/dd/yyyy',
                autoclose: true,
            });


            $(`#${id}`).datepicker().on('changeDate', function (event) {

                console.log(event, event.date.getFullYear(), event.date.getDate(), event.date.getMonth());

                var year = event.date.getFullYear();
                var month = event.date.getMonth();
                var date = event.date.getDate();

                var selectedDate = new Date(Date.UTC(year, month, date));
                
                console.log(event.date, selectedDate);
                if(exist) {
                    
                    vm.note.date = selectedDate;
                    // $(`#${id}`).val(vm.note.date);
                    console.log(vm.note);     
                } else {

                    // vm.reset();
                    vm.newNote.date = selectedDate;
                    console.log(vm.newNote );
                }
                
                // vm.showNote();
            });

            // $(`#${id}`).datepicker('setUTCDate');

            if(exist) {
                $(`#${id}`).datepicker('update', vm.note.date);

            } else if (!exist) {
                $(`#${id}`).datepicker('update', defaultDate);
            }
    }

    
    vm.showEditForm = function() {
        if(!vm.edit) {
            vm.edit = true;
        } else {
            vm.edit = false;
        }
    }

    vm.ngModel = function(e) {
        console.log(e.target.value)
        // vm.emptyNewDate = false;
       

        if(e.target.id === 'datepickerForExisting') {

            vm.note.date = e.target.value;

        } else {

            vm.newNote.date = e.target.value;
        }

    }

    vm.reset = function() {
        vm.emptyNewDate = false;
        console.log(vm.emptyNewDate)
    }


    function contactDetails() {
        $resource('/api/user/:id/contacts/:contact/')
            .get({id: currentUser._id, contact: $stateParams.id}).$promise
            .then((contact) => {

                if(contact.phones) {
                    contact.phones.phone1 = prettyPhoneFormat(contact.phones.phone1);
                    contact.phones.phone2 = prettyPhoneFormat(contact.phones.phone2);
                };
                vm.contact = contact;
                vm.states = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
                vm.editContact = angular.copy(contact);
                if(vm.editContact.address) {
                    if(JSON.stringify(vm.editContact.address.shippingAddress) === JSON.stringify(vm.editContact.address.billingAddress)) {
                        vm.editContact.address.ShippingSameBilling = true;
                    } else {
                        vm.editContact.address.ShippingSameBilling = false;
                    }
                };
                vm.editContact.setShippingSameBilling = function() {
                    if(vm.editContact.address) {
                        if(vm.editContact.address.ShippingSameBilling) {
                            vm.editContact.address.shippingAddress = JSON.parse(JSON.stringify(vm.editContact.address.billingAddress));
                       } else {
                        vm.editContact.address.shippingAddress = {};
                       }
                    } 
                };
                if(vm.editContact.address && vm.editContact.address.billingAddress) {
                    initGoogleMaps(vm.editContact._id);
                };
            })
    }


    function prettyPhoneFormat(rawPhone) {

        let phone = '';
        if(rawPhone) {
            phone = rawPhone
                        .split(' ')
                        .join('')
                        .split('')
                        .filter((item) => {
                            if(!isNaN(+item)) {
                                return item
                            }
                        });
                        
            phone.splice(0, 0, '(');
            phone.splice(4, 0, ') ');
            phone.splice(8, 0, '-');
            phone = phone.join('');
        }
        return phone
    }

    function saveChanges() {
        console.log(vm.newNote);
        $resource('/api/user/:id/contacts/:contact/', 
            {
                id: currentUser._id,
                contact: $stateParams.id
            }, 
            {
                update: {
                    method: 'PUT'
                }
            })
            .update(vm.editContact).$promise
            .then((note) => {
                console.log('Save as :', note);
                
                setTimeout(() => {
                    
                    document.querySelector('.vm_hide-notif').click();
                    vm.edit = false;
                        $scope.$apply();
                        $window.location.reload();
                    console.log('click');
                }, 1000)
                

            })
            .catch(console.error);
    }
    
    function validateZIP(e) {
        console.log(e);
        if(e.key.search(/[a-zA-Z]/) !== -1 && e.key !== 'Backspace' && e.key.search('Arrow') === -1 ) {
            e.preventDefault();
            if(e.target.value.length < 5) {
                e.target.classList.add('invalid')
                e.target.parentNode.classList.add('invalid')
            }
        } else {
            e.target.classList.remove('invalid')
            e.target.parentNode.classList.remove('invalid')
            return
        }
    }


    function getSms() {
        $resource('/api/user/:id/contacts/:contact/sms/', {id: currentUser._id, contact: $stateParams.id})
            .query({
                isArray: true
            }).$promise
            .then((smsHistory) => {
          
                vm.smsHistory = smsHistory.map((sms) => {
                    sms.showDetailsInfo = function() {
                        var id = this._id;
                                 this.showDetails = true;
                        setTimeout(() => {
                            $(`#${id}`).modal('show');
                        }, 10)            
                    };
                    return sms;
                });
                console.log('SMS HISTORY :', smsHistory);
            })
            .catch(console.error)
    }


    function computeBubleOffset(e, buble) {
        // console.log(e.clientY, e.pageY, e.offsetY);
        // e.stopPropagation();
        // buble.bubleMessage = true;
        var contactList = null;
        var ct = null;

        setTimeout(() => {
            

           contactList = document.querySelector('.contact-list');
            
           
        //    console.log(contactList)
           ct = document.querySelector('.buble-message');
    
                if(ct) {
                                        
                    var factBottom = ct.getBoundingClientRect().bottom;
                    var factTop = ct.getBoundingClientRect().top;
              

                    setTimeout(() => {


                        if(contactList) {
                            var listTop = contactList.getBoundingClientRect().top;
                            var listBottom = contactList.getBoundingClientRect().bottom;
                            if(factBottom > listBottom) {
    
                                ct.style.top = 38 + listBottom - factBottom + 'px';
                                return
        
                            } 
                            else if(factTop < listTop) {
                                // console.log("LISTTOP LESS THAN 0");
                                ct.style.marginTop = -78 + (listTop - factTop) + 'px';
                                return
                            } 

                        }

                        if(factBottom > window.innerHeight) {
    
                            ct.style.top = 38 + window.innerHeight - factBottom + 'px';
                            return
    
                        } 
                        else if(factTop < 0) {
                            // console.log("TOP LESS THAN 0");
                            ct.style.marginTop = -78 - (factTop) + 'px';
                            return
                        } 
                    }, 1)
                    
                    // console.log(Math.round(factTop), Math.round(factBottom), window.innerHeight);
                } 
                
        }, 1)

    }


    

    function clearNoteArea(e) {

        var beginOfVal = e.target.value.length;

        for(var i = 0; i < e.target.value.length; i++) {

            if(e.target.value.charAt(i) !== ' ') {
                beginOfVal = i;
                console.log("VALUE", e.target.value, beginOfVal);
                break
            }
        }

        e.target.value = e.target.value.slice(beginOfVal); 

    }
    
    function saveNote() {

        console.log(vm.newNote);
        
        if(vm.newNote.date && vm.newNote.description ) {
            vm.emptyNewNote = false;
            vm.emptyNewDate = false;
            $resource('/api/user/:id/contacts/:contact/notes/', {id: currentUser._id, contact: $stateParams.id})
                .save(vm.newNote).$promise
                .then((note) => {
                    $('#datepickerForNew').datepicker('update', defaultDate);
                    console.log('Save as :', note);
                    vm.newNote.description = '';
                    getNotes();
                })
                .catch(console.error)
        } else if (vm.newNote.description && !vm.newNote.date){

            vm.emptyNewDate = true;
            vm.emptyNewNote = false;
        } else if (!vm.newNote.description && vm.newNote.date){

            vm.emptyNewDate = false;
            vm.emptyNewNote = true;
        } else if (!vm.newNote.description && !vm.newNote.date){

            vm.emptyNewDate = true;
            vm.emptyNewNote = true;
        }

    }

    function getNotes() {

        $resource('/api/user/:id/contacts/:contact/notes/', {id: currentUser._id, contact: $stateParams.id})
            .query({
                isArray: true
            }).$promise
            .then((notes) => {
                vm.notes = notes
            })
            .catch(console.error)

    }


    function getNoteById(id) {
        
        var note = vm.notes.find((note) => {
            return id === note._id
        })
        
       
        vm.note = (function(note) {
            var editYear = new Date(note.date).getUTCFullYear(),
                editMonth = new Date(note.date).getUTCMonth(),
                editNumber = new Date(note.date).getUTCDate(),
                editDate = new Date(editYear, editMonth, editNumber);
            var editNote = angular.copy(note);  
                editNote.date = editDate;
            return editNote;
        }(note));

        initDatepicker("datepickerForExisting", vm.emptyDate, true);
    }


    function updateNote(e) {

        console.log(e.target.attributes, vm.note);
        if(vm.note.date && vm.note.description) {
            
            e.target.setAttribute('data-dismiss', 'modal');
            vm.emptyNote = false
            
            $resource('/api/user/:id/contacts/:contact/notes/:note/',
                {
                    id: currentUser._id,
                    contact: $stateParams.id,
                    note: vm.note._id
                },
                {
                    update: {
                        method: 'PUT'
                    }
                })
                .update(vm.note).$promise
                .then((note) => {
                    console.log("+++++++++++++UPDATED NOTE", note);
                    getNotes();
                    // vm.note.description = '';
                })
                .catch(console.error);

        } else if (vm.note.description && !vm.note.date){

            e.target.setAttribute('data-dismiss', '');
            vm.emptyDate = true;
            vm.emptyNote = false;
        } else if (!vm.note.description && vm.note.date){

            e.target.setAttribute('data-dismiss', '');
            vm.emptyDate = false;
            vm.emptyNote = true;
        } else if (!vm.note.description && !vm.note.date){

            e.target.setAttribute('data-dismiss', '');
            vm.emptyDate = true;
            vm.emptyNote = true;
        }
        
    }


    function removeNote(id) {
        console.log(vm.note);

        $resource('/api/user/:id/contacts/:contact/notes/:note/',
            {
                id: currentUser._id,
                contact: $stateParams.id,
                note: id,
            })
            .delete().$promise
            .then((res) => {
                console.log('DELETE :', res);
                getNotes();
            })
            .catch(console.error)

    }
    
}
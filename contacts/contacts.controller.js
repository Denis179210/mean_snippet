module.exports =
    angular
        .module('cpApp')
        .controller('contactsController', ['User', 'ActionGroup', '$templateCache', '$http', '$resource', '$window', '$state', '$scope','FileUploader', contactsController])
        
// require('./contacts.sass')

function contactsController(User, ActionGroup, $templateCache, $http, $resource, $window, $state, $scope, FileUploader) {
    
    window.addEventListener('scroll', fixedSelected);


    $templateCache.put('export-contact.html', require('./modal/export-contact.html'));
    $templateCache.put('import-contact.html', require('./modal/import-contact.html'));
    $templateCache.put('new-contact.html', require('./modal/new-contact.html'));
    $templateCache.put('notif-delete.html', require('./modal/notif-delete.html'));
    $templateCache.put('no-contacts.html', require('./no-contacts.html'));
    $templateCache.put('no-matched-contacts.html', require('./no-matched-contacts.html'));



    var currentUser;
        currentUser = User.currentUser();

    var newContactDefault = {
    
        name: {
            firstName:  '',
            lastName: '', 
        },
        address: {
            state: '',
            city: '',
            zip: '',
            address1: '',
            address2: ''
        },
        phones: {
            phone1: '',
            phone2: '',
        },
        social: {
            fb: '',
            li: ''
        },
        company: '',
        jobtitle: '',
        email: '',
        user: currentUser._id
    };


    var ratePointerDefault = 10;
    var activePageDeault = 0;
    var sortParamDefault = {"name.firstName": -1};

    var vm = this;

        vm.currentUser = currentUser;
        vm.disable = disable;
        vm.createNewContact = createNewContact;
        vm.prevPage = prevPage;
        vm.nextPage = nextPage;
        vm.showRate = showRate;
        vm.ratePointer = ratePointerDefault;
        vm.activePage = activePageDeault;
        vm.getContacts = getContacts;
        vm.searchContacts = searchContacts;
        vm.skipPage = skipPage;
        vm.hideBegin = hideBegin;
        vm.hideEnd = hideEnd;
        vm.assignAG = assignAG;
        vm.addContactToActionGroup = addContactToActionGroup;
        vm.actionGroupAll = actionGroupAll;
        vm.allContactsChecked = false;
        vm.showActionGroup = showActionGroup;
        vm.checked = checked;
        vm.asignSortParam = asignSortParam;
        vm.highliteArrows = highliteArrows;
        vm.deleteActionGroup = deleteActionGroup;
        vm.clear = clear;
        vm.exportContacts = exportContacts;
        // vm.importContactCSV = importContactCSV;
        vm.cancelUpload = cancelUpload;
        
        vm.sortContactsBy = {
            firstName: false,
            lastName: false,
            email: false,
            phone1: false,
            company: false
        };
        
        vm.newContact = newContactDefault;
        vm.actionGroup = ActionGroup.actionGroup;
        vm.firstInRange = 0;
        vm.rangePointer = 6;
        vm.lastInRange = vm.firstInRange + vm.rangePointer; 
        vm.searchQuery = '';
        
        vm.sortParam = sortParamDefault;

        

        vm.fixedSelected = fixedSelected;

        vm.CSV = (function() {
            
            var loader = new FileUploader();
                loader.url = `/api/user/${currentUser._id}/contacts/add_contact/`;
                loader.queueLimit = 1;
                loader.filters.push({
                    name: 'lessThen10MB',
                    fn: function(file) {
                        
                        
                        
                        if(file.name.indexOf('.csv', this.length - 4) === -1) {
                            console.log(file.type)
                            document.querySelector('[data-placeholder]').setAttribute('placeholder', 'The type of this file doesn\'t match! Please, select CSV .');
                            return false
                        } 


                        if(file.size > 1e7) {
                            document.querySelector('[data-placeholder]').setAttribute('placeholder', 'File size is too large !');
                            return false
                        }
                        else {
                            document.querySelector('[data-placeholder]').removeAttribute('placeholder');
                            return true
                        }
                    }
                })
            return loader;
        }());

        FileUploader.prototype.importContactCSV = _importContactCSV;


        getContactsAmount(null, vm.sortParam)
            .then(() => {
                getContacts(vm.activePage, null, vm.sortParam);
            })
            .catch(console.error)





        function fixedSelected() {
            var selected = document.querySelector('.selected-contacts');
            
            if(selected && selected.getBoundingClientRect().top < 0 & vm.actionGroup !== 0) {
                console.log("Added");
                selected.classList.add('fixed-selected-contacts');
            }
            if(selected && window.pageYOffset == 0) {
                selected.classList.remove('fixed-selected-contacts');
            }
        }

        function exportContacts(format) {
           
            var HEADERS = ["firstname","lastname","state(Shipping)","city(Shipping)","zip(Shipping)","address1(Shipping)","address2(Shipping)","state(Billing)","city(Billing)","zip(Billing)","address1(Billing)","address2(Billing)","phone1","phone2","facebook","linkedin","twitter","youtube","company","jobtitle","email"]


            $resource('/api/user/:id/contacts/export/:format/', {id: currentUser._id, format: format})
                .save({
                    format: format,
                    headers: HEADERS,
                    rows: vm.actionGroup
                }).$promise
                .then((contacts) => {
                    return downloadFile(contacts.csv, 'csv');
                })
                .then((link) => {

                    document.body.removeChild(link);

                    return getContactsAmount(null, vm.sortParam)
                })
                .then(() => {

                    clear();
                    vm.CSV.clearQueue();

                    vm.actionGroup = [];
                    vm.allContactsChecked = false;
                    vm.activePage = activePageDeault;

                
                    document.querySelector('[nv-file-select]').value = '';
                    
                    getContacts(vm.activePage, null, vm.sortParam);
                })
                .catch(console.error)

        }   

        function downloadFile(rawString, extention) {

            var download = document.createElement('a');
                download.id = 'download-csv';
                download.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(rawString)}`);
                download.setAttribute('download', `Cahootly_${currentUser.name.firstName}_${currentUser.name.lastName}_contacts.${extention}`);
                document.body.appendChild(download);
                document.querySelector('#download-csv').click();

            return download;
        }
        

        function _importContactCSV(){

            var newContactListFromCSV = this.queue[0]._file;
            var fd = new FormData();
                fd.append('contacts', newContactListFromCSV)

            $http.post(this.url, fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).then((contacts) => {

                getContactsAmount(null, vm.sortParam)
                    .then(() => {
                        clear();
                        vm.actionGroup = [];
                        vm.allContactsChecked = false;
                        vm.activePage = activePageDeault;
                        this.clearQueue();
                        document.querySelector('[nv-file-select]').value = '';

                        getContacts(vm.activePage, null, vm.sortParam);
                    })
                    .catch(console.error)
            })
        }
       
        
        function cancelUpload() {
            document.querySelector('[data-placeholder]').removeAttribute('placeholder');
            vm.CSV.clearQueue();
            document.querySelector('[nv-file-select]').value = '';
        }


        function disable() {

            if (vm.newContact.name.firstName !== '' &&
                vm.newContact.name.lastName !== '' &&
                vm.newContact.company !== '' &&
                vm.newContact.email !== '' &&
                vm.newContact.phones.phone1 !== '') {

                return false;
            } else {

                return true;
            }


        }

        function createNewContact() {
            
            $resource('/api/user/:id/contacts/add_contact/', {id: currentUser._id})
                .save(vm.newContact).$promise
                .then((contact) => {

                    console.log(contact);
                    $state.go(`account.main.contact-details`, {id: contact._id});
                })
                .catch(console.error)
        }

        function pagination(page) {
            
            if(vm.pagesTotal.length > vm.rangePointer) {

                if(page < vm.firstInRange) {
                    vm.firstInRange = vm.firstInRange - vm.rangePointer;
                    vm.lastInRange = vm.lastInRange - vm.rangePointer;
                };
            
                if(page === vm.lastInRange) {
                    vm.firstInRange = vm.firstInRange + vm.rangePointer;
                    vm.lastInRange = vm.lastInRange + vm.rangePointer;
                }; 
            };
            if(page === vm.pagesTotal.length - 1) {
                vm.lastInRange = vm.pagesTotal.length;
                vm.firstInRange = vm.pagesTotal.length - vm.rangePointer;
            };
            if(page === 0 || page < vm.rangePointer) {
                vm.firstInRange = 0;
                vm.lastInRange = vm.firstInRange + vm.rangePointer;
            };

        }

        function getContactsAmount(filter, sortField) {
            
           return $resource('/api/user/:id/contacts/',
                    {
                        id: currentUser._id,
                    })
                    .get({
                        amount: true,
                        filter: filter,
                        sortBy: sortField
                    }).$promise
                    .then((contacts) => {
                        vm.contactsAmount = contacts.amount;
                        vm.pagesAmount = Math.ceil(vm.contactsAmount / vm.ratePointer);

                        vm.pagesTotal = [];

                        for(var page = 1; page <= vm.pagesAmount; page++) {
                            vm.pagesTotal.push(page);
                        }
                        return vm.contactsAmount
                    
                    })
        };

        function getContacts(page, filter, sortField) {
            
            $resource('/api/user/:id/contacts/',
                {   
                    id: currentUser._id
                })
                .query({
                    isArray: true,
                    skip: vm.ratePointer * page,
                    limit: vm.ratePointer,
                    filter: filter,
                    sortBy: sortField
                }).$promise
                .then((contacts) => {
                    
                    vm.contacts = contacts.map((contact) => {
                        contact.phones.phone1 = prettyPhoneFormat(contact.phones.phone1)
                        contact.phones.phone2 = prettyPhoneFormat(contact.phones.phone2)

                        return contact;
                    });
                    vm.activePage = page;


                    pagination(page);
                    
                })
                .catch(console.error)
        };
        

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




        function searchContacts(page, sortBy, reset) {
            console.log(vm.searchQuery);
            
            var reset = reset || false;

            if(reset) {
                vm.allContactsChecked = false;
                ActionGroup.clearAG();
                vm.actionGroup = ActionGroup.actionGroup;
            }

            if(Object.keys(sortBy).length === 0) {
                sortBy = null;  
            };

            getContactsAmount(vm.searchQuery, sortBy)
                .then(() => {
                    getContacts(page, vm.searchQuery, sortBy);
                })
                .catch(console.error)

        }

        function clear() {
            vm.searchQuery = '';
        }

        function prevPage(page) {

            if(page < 0) {
                page = 0
            }
            if(vm.searchQuery.length > 0 && !vm.sortParam) {
                searchContacts(page);
            } else if(vm.searchQuery.length > 0 && vm.sortParam) {
                searchContacts(page, vm.sortParam);
            } else {
                vm.getContacts(page, null, vm.sortParam); 
            }
        }
    
        function nextPage(page) {
            if(page == vm.pagesTotal.length) {
                page = page - 1;
            }
            
            if(vm.searchQuery.length > 0 && !vm.sortParam) {
                searchContacts(page)
            } else if(vm.searchQuery.length > 0 && vm.sortParam) {
                searchContacts(page, vm.sortParam);
            } else {
                vm.getContacts(page, null, vm.sortParam);
            }
        }

        function showRate() {
            vm.activePage = activePageDeault;

            if(vm.searchQuery.length > 0 && !vm.sortParam) {
                searchContacts(vm.activePage)
            } else if(vm.searchQuery.length > 0 && vm.sortParam) {
                searchContacts(vm.activePage, vm.sortParam);
            } else {
                getContactsAmount(null, vm.sortParam)
                    .then(() => {
                        getContacts(activePageDeault, null, vm.sortParam);
                    })
                    .catch(console.error)
               
            }
        }
        
        function skipPage(page) {
            return page < vm.firstInRange || page > vm.lastInRange; 
        }
        function hideBegin() {
            return vm.lastInRange > vm.rangePointer
        }
        function hideEnd() {
            return vm.lastInRange > vm.pagesTotal.length - 1;
        }
        function addContactToActionGroup(contact) {
            
            var searchItem = vm.actionGroup.findIndex((item) => {
                
                return contact._id === item._id
            })
            
            if(searchItem === -1) {
                console.log("Added", contact)
                vm.actionGroup.push(contact);
            } else {
                console.log("Removed", contact)
                vm.actionGroup.splice(searchItem, 1);
            }
            console.log('CurrState', vm.actionGroup, ActionGroup.actionGroup);    
            
            checkIfallContactsChecked();
        }

        function checked(contact) {
            return vm.actionGroup.find((item) => {
                return contact._id === item._id
            }) 
        }
        

        function checkIfallContactsChecked() {

            if(vm.actionGroup.length !== vm.contactsAmount) {
                
                vm.allContactsChecked = false;
            } else {
                
                vm.allContactsChecked = true;
            }
        }


        function actionGroupAll() {
            if(!vm.allContactsChecked) {
                if(vm.actionGroup.length < vm.contactsAmount) {
                    console.log(vm.actionGroup);

                } else {
                    ActionGroup.clearAG();
                    vm.actionGroup = [];
                }
            } else if(vm.allContactsChecked && vm.searchQuery){
           
                        $resource('/api/user/:id/contacts/', {id: currentUser._id})
                            .query({
                                isArray: true,
                                filter: vm.searchQuery,
                                sortBy: vm.sortParam
                            }).$promise
                            .then((group) => {

                                vm.actionGroup = [];
                                vm.actionGroup = group.map((contact) => {
                                                    contact.phones.phone1 = prettyPhoneFormat(contact.phones.phone1)
                                                    contact.phones.phone2 = prettyPhoneFormat(contact.phones.phone2)

                                                return contact;
                                });
                            })
                            .catch(console.error)
                            
            } else if(vm.allContactsChecked && !vm.searchQuery){
                $resource('/api/user/:id/contacts/', {id: currentUser._id})
                    .query({
                        isArray: true,
                        sortBy: vm.sortParam
                    }).$promise
                    .then((group) => {

                        vm.actionGroup = [];
                        vm.actionGroup = group.map((contact) => {
                            contact.phones.phone1 = prettyPhoneFormat(contact.phones.phone1)
                            contact.phones.phone2 = prettyPhoneFormat(contact.phones.phone2)
                            
                            return contact;
                        });
                        vm.assignAG(vm.actionGroup);
                    })
                    .catch(console.error)
            }    
        }

       


        function showActionGroup() {
            console.log(vm.actionGroup);
        }

        function asignSortParam(field) {

            vm.sortParam = {};    
            console.log(field)
         
            for(var key in vm.sortContactsBy) {
                if(key === field.flag) {
                  
                    if(vm.sortContactsBy[key]) {
                        vm.sortParam[field.sortParam] = 1; 
                    } else {
                        vm.sortParam[field.sortParam] = -1
                    }
                    continue                    
                }
                vm.sortContactsBy[key] = false
            }

            if(vm.searchQuery.length > 0 && !vm.sortParam) {

                searchContacts(vm.activePage);
            } else if(vm.searchQuery.length > 0 && vm.sortParam) {

                searchContacts(vm.activePage, vm.sortParam);
            } else if(vm.sortParam && !vm.searchQuery) {

                getContactsAmount(null, vm.sortParam)
                    .then(() => {
                        getContacts(vm.activePage, null, vm.sortParam);
                    })
                    .catch(console.error)

            } else {
                vm.activePage = activePageDeault;
                getContactsAmount(null, vm.sortParam)
                    .then(() => {
                        getContacts(vm.activePage, null, vm.sortParam);
                    })
                    .catch(console.error)
            }
        }

        function highliteArrows(arg) {
            var sortParam = Object.keys(vm.sortParam)[0];

            return sortParam === arg 

        }



        function deleteActionGroup() {
            $resource('/api/user/:id/contacts/', {id: currentUser._id}, {
                    cut: {
                        method: 'PATCH',
                    }
                })
                .cut({"delete": vm.actionGroup} ).$promise
                .then((removed) => {
                    console.log(removed.deleted)
                    return getContactsAmount(null);
                    
                })
                .then((res) => {
                    console.log("AMOUNBT", res);
                    clear();
                    vm.actionGroup = [];
                    vm.allContactsChecked = false;
                    vm.activePage = activePageDeault; 
                    if(vm.contactsAmount <= vm.activePage * vm.ratePointer) {
                        getContacts(vm.pagesTotal.length - 1, '', vm.sortParam);
                        
                    } else if(vm.contactsAmount > vm.firstInRange) {
                        
                        getContacts(vm.activePage, '', vm.sortParam);
                    }
                    
                })
                .catch(console.error)
        }

        function assignAG(ag) {
            ActionGroup.assignAG(ag);
            console.log('ACTION GROUP FOR THE SMS TAB =============> : \n ', ActionGroup.actionGroup);
        }
}

import {selectedKey, refreshKeys, tempKeys, keys} from '../components/KeyList';
import {getClient} from './BluzelleService'
import {observe} from 'mobx';


export const activeValue = observable(undefined);

export const loadingValue = observable(false);


export const activeTTL = observable(undefined);

export const loadingTTL = observable(false);




// ttl countdown/reload

let countdown;
    

// when activeTTL was last set, not including countdown updates
let time; 
let value;

let update_time = true;


observe(activeTTL, ({newValue, oldValue}) => {


    if(update_time) {
        time = new Date().getTime();
        value = newValue;
    }

    update_time = true;



    clearTimeout(countdown);


    const countdown_f = () => {

        const v = value - Math.round((new Date().getTime() - time) / 1000);

        
        if(v - 1 <= 0) {
            setTimeout(() => reload(), 1500);
        }
        
        update_time = false;
        activeTTL.set(v);

    };


    if(newValue > 0) {

        countdown = setTimeout(countdown_f, 1000);

    }


});




// key selection
observe(selectedKey, ({newValue, oldValue}) => {

	activeValue.set(undefined);


	if(newValue !== undefined) {

		// We can say that if the value is an object, 
		// wrap in an OMR. See: JSONEditor.js.

        loadingValue.set(true);

        getClient().quickread(newValue).then(value => {
            activeValue.set(value);
            loadingValue.set(false);
        }).catch((e) => {

            if(e.message.includes('DELETE_PENDING')) {
                reload();
            } else {
                alert('Failed to quickread value due to bluzelle network error.');
            }

            loadingValue.set(false);
            console.error(e);

        });
        
		getClient().read(newValue).then(value => {
			activeValue.set(value);
            loadingValue.set(false);
        }).catch((e) => {

            if(e.message.includes('DELETE_PENDING')) {
                reload();
            } else {
                alert('Failed to quickread value due to bluzelle network error.');
            }

            loadingValue.set(false);
            console.error(e);

        });


        reloadTTL();

	}

});


export const save = () => 
    getClient().update(selectedKey.get(), activeValue.get())
    .catch(() => alert('Failed to save due to bluzelle network error.'));


export const remove = () => new Promise(resolve => {

    const sk = selectedKey.get(); 
    selectedKey.set();

    tempKeys.push(sk);

    return getClient().delete(sk).then(() => {
        reload().then(resolve);
    })
    .catch(() => {

        tempKeys.splice(tempKeys.indexOf(sk), 1);

        selectedKey.set(sk);
        
        alert('Failed to remove due to bluzelle network error.');

    });

});


export const create = (key, value) => {


    keys.push(key);
    tempKeys.push(key);

    getClient().create(key, value).then(() => {
        
        while(tempKeys.includes(key)) {
            tempKeys.splice(tempKeys.indexOf(key), 1);
        }

    }).catch(e => {

        while(tempKeys.includes(key)) {
            tempKeys.splice(tempKeys.indexOf(key), 1);
        }
        
        keys.splice(keys.indexOf(key), 1);
        
        alert('Failed to create key due to bluzelle network error.'); 

    });

};


export const rename = (oldKey, newKey) => new Promise(resolve => {

    getClient().read(oldKey).then(v => {

        getClient().delete(oldKey).then(() => {

            getClient().update(newKey, v).then(() => {

            	const s = selectedKey;

                if(selectedKey.get() === oldKey) {

                    selectedKey.set(newKey);

                }

                reload().then(resolve);

            }).catch(() => alert('Bluzelle network error.'));

        }).catch(() => alert('Bluzelle network error.'));

    }).catch(() => alert('Bluzelle network error.'));

});
    


export const reload = () => new Promise(resolve => {

    refreshKeys().then(() => {

        reloadKey();

        resolve();

    });

});


export const reloadKey = () => {

    const sk = selectedKey.get(); 
    selectedKey.set();

    if(keys.includes(sk)) {

        selectedKey.set(sk);

    }

};


export const reloadTTL = () => {

    loadingTTL.set(true);

    getClient().ttl(selectedKey.get()).then(value => {
        activeTTL.set(value);
        loadingTTL.set(false);
    }).catch((e) => {

        if(e.message === 'TTL_RECORD_NOT_FOUND') {

            activeTTL.set(0);
            loadingTTL.set(false);

        } else {

            alert('Failed to read time-to-live due to bluzelle network error.');
            loadingTTL.set(false);
            console.error(e);

        }
        
    });

};


import { getObjectValue } from "./utils/utils";


export default class User {

    defaultProfile = {
        username: '',
        firstName: '',
        lastName: '',
        company: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        zip: ''
    };

    defaultProfileErrors = {
        usernameError: '',
        firstNameError: '',
        lastNameError: '',
        companyError: '',
        address1Error: '',
        address2Error: '',
        cityError: '',
        stateError: '',
        zipError: '',
    };

    constructor(auth0Profile) {
        //Bind Login function, allowing you to use this class outside of this class.
        // this.login = this.login.bind(this);
        this.prepopulateProfile();
        this.firstName = auth0Profile.given_name;
        this.lastName = auth0Profile.family_name;
        this.sub = auth0Profile.user_id ? auth0Profile.user_id : auth0Profile.sub;
        this.email = auth0Profile.email;
        if(getObjectValue(auth0Profile, "user_metadata")) {
            this.username = auth0Profile.user_metadata.username;
            this.firstName = auth0Profile.user_metadata.firstName ? auth0Profile.user_metadata.firstName : this.firstName;
            this.lastName = auth0Profile.user_metadata.lastName ? auth0Profile.user_metadata.lastName : this.lastName;
            this.company = auth0Profile.user_metadata.company;
            this.address1 = auth0Profile.user_metadata.address1;
            this.address2 = auth0Profile.user_metadata.address2;
            this.city = auth0Profile.user_metadata.city;
            this.state = auth0Profile.user_metadata.state;
            this.zip = auth0Profile.user_metadata.zip;
        }
    }


    prepopulateProfile = () => {
        Object.keys(this.defaultProfile).forEach((key) => {
            this[key] = this.defaultProfile[key];
        });
    };
};

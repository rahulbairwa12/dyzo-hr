export const intialLetterName = (firstname, lastname, name, email) => {
    if (firstname && lastname) {
        return `${firstname[0]?.toUpperCase()}${lastname[0]?.toUpperCase()}`;
    } else if (firstname && !lastname) {
        return `${firstname[0]?.toUpperCase()}`;
    } else if (!firstname && !lastname && name) {
        const nameArray = name.split(" ");
        if (nameArray.length === 2) {
            return `${nameArray[0][0]?.toUpperCase()}${nameArray[1][0]?.toUpperCase()}`;
        }
        else{
            return `${nameArray[0][0]?.toUpperCase()}`;
        }
    }
    else if(email){
        return `${email[0]?.toUpperCase()}`;
    }
    return "";
}
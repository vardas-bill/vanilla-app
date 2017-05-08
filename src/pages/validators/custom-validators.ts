import { AbstractControl, ValidatorFn, FormControl } from '@angular/forms';


export function checkFirstCharacterValidator(nameRe: RegExp): ValidatorFn
{
  return (control: AbstractControl): {[key: string]: any} => {
    const valid = /^\d/.test(control.value);
    return (valid) ? {checkFirstCharacterValidatorOutput: true} : null;
  };
}

export class UsernameValidator {

  static checkUsername(control: FormControl): any {

    return new Promise(resolve => {

      //Fake a slow response from server

      setTimeout(() => {
        if (control.value.toLowerCase() === "greg") {

          resolve({
            "username taken": true
          });

        } else {
          resolve(null);
        }
      }, 2000);

    });
  }
}

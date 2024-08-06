import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../domain/interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  private userProfileImage: string = 'assets/usuario-photo.jpg';
  // Usuário padrão
  private defaultUser: User = {
    id: '1',
    nome: 'Anderson',
    dataNascimento: '12/07/2000',
    sexo: 'masculino',
    email: 'jr.andersonfs@gmail.com',
    phone: '(22) 99931-4699',
    instagram: '@andersonjreng'
  };

  constructor() {
    // Define o usuário padrão como o usuário atual
    this.currentUserSubject.next(this.defaultUser);
  }

  setUser(user: User) {
    this.currentUserSubject.next(user);
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  updateUserProfileImage(imageUrl: string) {
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        image: imageUrl
      };
      this.currentUserSubject.next(updatedUser);
    }
  }


}

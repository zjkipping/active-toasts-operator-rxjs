import { of, fromEvent, Subject, merge, interval, Observable } from 'rxjs'; 
import { mapTo, mergeMap, take } from 'rxjs/operators';

interface Toast {
  message: string;
  duration: number
}

const toastStream = new Subject<Toast>();

toastStream.pipe(
  activeToasts()
).subscribe(toasts => console.log(toasts));

function activeToasts() {
  return function(source: Observable<Toast>) {
    return new Observable(observer => {
      let toasts = [];
      return source.subscribe(toast => {
        toasts.push(toast);
        observer.next([...toasts]);
        setTimeout(() => {
          const index = toasts.indexOf(toast);
          toasts.splice(index, 1);
          observer.next([...toasts]);
        }, toast.duration);
      })
    })
  }
}

const launchButton = document.getElementById('launchButton');

let x = 1;

fromEvent(launchButton, 'click').subscribe(() => {
  toastStream.next({ message: `Toast #${x++}`, duration: 5000 });
})


// More complete version from a project where I used the above as a starting point
//   Has canceling & other bits added

interface ProjectToast {
  message: string;
  duration: number | 'infinite';
  style: 'succes' | 'warning' | 'error';
}

interface ActiveToast extends ProjectToast {
  close: () => void;
  timeout: ReturnType<typeof setTimeout> | null;
}

function accumulateActiveToasts(defaultDuration = 1000) {
  return function(source: Observable<ProjectToast>) {
    return new Observable<ActiveToast[]>((observer) => {
      const toasts: ActiveToast[] = [];
      return source.subscribe((toast) => {
        const activeToast: ActiveToast = {
          ...toast,
          close: () => {
            if (activeToast.timeout) {
              clearTimeout(activeToast.timeout);
            }
            const index = toasts.indexOf(activeToast);
            toasts.splice(index, 1);
            observer.next([...toasts]);
          },
          timeout: 
            toast.duration === 'infinite'
              ? null
              : setTimeout(() => {
                activeToast.close();
              }, toast.duration || 1000)
        };
        toasts.push(activeToast);
        observer.next([...toasts]);
      })
    });
  };
}



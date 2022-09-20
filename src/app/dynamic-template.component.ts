import {
  Compiler,
  Component,
  ComponentRef,
  Injector,
  NgModule,
  NgModuleRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HelloComponent } from './hello.component';

@Component({
  selector: 'dynamic-template',
  template: `<h2>Stuff bellow will get dynamically created and injected<h2>
          <div #vc></div>`,
})
export class DynamicTemplateComponent {
  @ViewChild('vc', { read: ViewContainerRef }) vc: ViewContainerRef;

  private cmpRef: ComponentRef<any>;

  constructor(
    private compiler: Compiler,
    private injector: Injector,
    private moduleRef: NgModuleRef<any>
  ) {}

  ngAfterViewInit() {
    // Here, get your HTML from backend.
    this
      .createComponentFromRaw(`<div style="border: 1px solid blue; margin: 5px; padding: 5px">
    <div>Start Raw Component ... </div> 
    <hello></hello>
    <h5>Binding value: {{data.some}}</h5> 
    <span *ngIf="getX() === 'X'">Use *ngIf: {{getX()}} </span>
    {{ 4+5 }}

    </div>
    <span *ngFor="let i of data.lst">{{i}}<br/></span>
    `);
  }

  // Here we create the component.
  private createComponentFromRaw(template: string) {
    // Let's say your template looks like `<h2><some-component [data]="data"></some-component>`
    // As you see, it has an (existing) angular component `some-component` and it injects it [data]

    // Now we create a new component. It has that template, and we can even give it data.
    const styles = [];
    function TmpCmpConstructor() {
      this.data = { some: 'smao', lst: [1, 2, 3] };
      this.getX = () => 'X';
    }
    const tmpCmp = Component({ template, styles })(
      new TmpCmpConstructor().constructor
    );

    // Now, also create a dynamic module.
    const tmpModule = NgModule({
      imports: [CommonModule],
      declarations: [tmpCmp, HelloComponent],
      // providers: [] - e.g. if your dynamic component needs any service, provide it here.
    })(class {});

    // Now compile this module and component, and inject it into that #vc in your current component template.
    this.compiler
      .compileModuleAndAllComponentsAsync(tmpModule)
      .then((factories) => {
        const f = factories.componentFactories[0];
        this.cmpRef = f.create(this.injector, [], null, this.moduleRef);
        this.cmpRef.instance.name = 'my-dynamic-component';
        this.vc.insert(this.cmpRef.hostView);
      });
  }

  // Cleanup properly. You can add more cleanup-related stuff here.
  ngOnDestroy() {
    if (this.cmpRef) {
      this.cmpRef.destroy();
    }
  }
}

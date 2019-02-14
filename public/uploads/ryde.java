
import java.util.Scanner;

class Conversion{

	float dollar;

	public void set_value(float dollar){

		this.dollar = dollar;
	}
	public float get_yen(){

		return dollar * 109.87f;
	}
	public float get_euro(){

		return dollar * 0.88f;
	}
	public float get_peso(){

		return dollar * 19.11f;
	}

}
public class Currency{
	public static void main(String[] args){
		Conversion object_cont = new Conversion();

		Scanner scan_obj = new Scanner(System.in);

        System.out.println("Enter Dollar Ammount");

		float dollar = scan_obj.nextFloat();

		object_cont.set_value(dollar);
	

	System.out.println("Enter one of the following commands:");
	System.out.println("1 - Yen");
	System.out.println("2 - Euro");
	System.out.println("3 - Peso");
	System.out.println("4 - All ");
	System.out.println("Enter \"1\", \"2\",\"3\" or \"4\" ");
	int choiceentry = scan_obj.nextInt();

	while (choiceentry < 1 || choiceentry > 4 ) {


        System.out.println("Enter \"1\", \"2\", \"3\" or \"4\"");
        choiceentry = scan_obj.nextInt();

    }

    if(choiceentry == 1) {
 
           System.out.print( dollar + " Convert to " + object_cont.get_yen() + " Yen");
    }
    else if(choiceentry == 2) {
       
           System.out.print( dollar + " Convert to " + object_cont.get_euro() + " Euro");
    }
    else if(choiceentry == 3) {
       System.out.print( dollar + " Convert to " + object_cont.get_peso() + " Peso");
    }
    else if(choiceentry == 4) {
       System.out.println( dollar + " Convert to " + object_cont.get_yen() + " Yen");
       System.out.println( dollar + " Convert to " + object_cont.get_euro() + " Euro");
       System.out.println( dollar + " Convert to " + object_cont.get_peso() + " Peso");
    }

}   
}
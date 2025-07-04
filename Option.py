# This is probably useful for encapsulation at least

class Option:

    def __init__(self,  K: float,   # strike price
                        T: int,     # maturity
                        style: str, # American or European
                        type: str,  # Call or Put
                 ):
        self.K = K
        self.T = T
        self.style = style
        self.type = type
        
        self.payoff = self.get_payoff_function()

        assert style in ['American', 'European'], "Style must be either 'American' or 'European'"
        assert type in ['Call', 'Put'], "Type must be either 'Call' or 'Put'"
        assert T >= 0, "Maturity must be a non-negative integer"
        assert K >= 0, "Strike price must be a non-negative float"    

    
    def get_payoff_function(self):
        if self.type == 'Call':
            return lambda S: max(0, S - self.K)
        elif self.type == 'Put':
            return lambda S: max(0, self.K - S)
        else:
            raise ValueError("Type must be either 'Call' or 'Put'")

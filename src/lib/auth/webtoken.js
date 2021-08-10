import Identity, {
    AbstractIdentityResolver,
    AbstractIdentityTrace,
    UnknownIdentityError } from './identity.js';
import { WebtokenSymbol } from '../security/webtoken.js';
import App from '../app.js';

class WebtokenResolver extends AbstractIdentityResolver
{
    /**
     * @inheritdoc
     */
    resolve(request, source) {
        let token = this._detectToken(request);
        if (token !== null) {
            let webtoken = App.make(WebtokenSymbol);
            return webtoken.verify(token)
                .then((decoded) => {
                    return new Identity(decoded._IID, (id) => source.getInstance(id));
                }).catch(() => {
                    throw new UnknownIdentityError('Invalid token');
                });
        }
        return false;
    }

    /**
     * Check if request has auth token
     * 
     * @param {Request} request 
     * @returns {String|null}
     */
    _detectToken(request) {
        let header = request.getHeader('authorization');
        if (header !== undefined) {
            let [type, data] = header.split(/\s+/).filter((part) => part !== '');
            if (type.toLowerCase() === 'bearer') {
                return data;
            }
        }
        return null;
    }
}

class WebtokenTrace extends AbstractIdentityTrace
{
    /**
     * @inheritdoc
     */
    put(response, identity) {
        let webtoken = App.make(WebtokenSymbol);
        return webtoken.sign({
            _IID: identity.id,
        }).then((token) => {
            response.setHeader('authorization', `bearer ${token}`);
            return response;
        });
    }
}

export {
    WebtokenResolver,
    WebtokenTrace,
}